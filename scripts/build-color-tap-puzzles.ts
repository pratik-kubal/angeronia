// Turns every photo in public/paint-by-numbers/ into Color Tap's puzzles, one per level, at build
// time (DECISIONS.md ADR-022): lib/color-tap/generate.ts in Node, on pixels decoded by sharp, so
// every device gets the same puzzle and the tests check exactly what ships. Writes, all committed:
//
//   public/paint-by-numbers/puzzles/<picture>-<level>.<id>.json  each puzzle, named by its hash
//   public/paint-by-numbers/puzzles/<picture>.<hash>.webp        a small copy of the photo
//   lib/color-tap/pictures.ts                                    the manifest the game reads
//
// Only what changed is made again: a puzzle is remade when its photo, its level's settings or
// PIPELINE_VERSION change. Players' progress comes first, so a remade puzzle never replaces the old
// one outright: the old one stays, listed as retired, and a painting begun on it is finished on it.
// Only files nothing points at (not even a retired entry) are deleted. It runs before `npm run dev`
// and `npm run build`, so a photo dropped into the folder just works.
//
// A photo that can't be used (damaged, named the same as another, in a format it doesn't read, or
// whose puzzle would break a level's promises) never stops a build or the dev server: it is left
// out, with a warning (a picture already listed keeps its earlier puzzles), and the rest of the
// site builds. CI is where it is caught: --check changes nothing and fails on any photo that is
// unusable or whose puzzles weren't made and committed.
//
// Usage: npm run color-tap:puzzles [-- --force | --check]

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { generate } from "../lib/color-tap/generate";
import { LEVELS } from "../lib/color-tap/levels";
import { PICTURES } from "../lib/color-tap/pictures";
import { decodePuzzle, encodePuzzle } from "../lib/color-tap/puzzle";
import type { PictureInfo, PictureLevel } from "../lib/color-tap/types";
import { MANIFEST, PICTURES_DIR, PUZZLES_DIR, SEED, hash, loadPicture, publicUrl, puzzleKey, puzzleProblems, scanPictures, type Source } from "./color-tap-images";

const THUMB = { width: 360, quality: 74 };

const reason = (error: unknown) => (error instanceof Error ? error.message : String(error));
/** A served URL back to its file, with this platform's separators (the keep list and the clean-up must agree). */
const fileOf = (url: string) => path.join("public", ...url.slice(1).split("/").map(decodeURIComponent));
/** The file of one of a level's puzzles, current or retired: the same name with that id. */
const versionOf = (entry: PictureLevel, id: string) => fileOf(entry.src.replace(`.${entry.id}.json`, `.${id}.json`));

/** Decodes the whole photo: a damaged file fails here rather than half-way through a puzzle. */
async function readable(file: string): Promise<{ width: number; height: number }> {
  const { info } = await sharp(file).rotate().raw().toBuffer({ resolveWithObject: true });
  return { width: info.width, height: info.height };
}

/** The files in the puzzles folder, as paths; anything else in it (a folder, a dotfile) is reported, not touched. */
function puzzleFiles(): { files: string[]; strays: string[] } {
  if (!fs.existsSync(PUZZLES_DIR)) return { files: [], strays: [] };
  const files: string[] = [];
  const strays: string[] = [];
  for (const entry of fs.readdirSync(PUZZLES_DIR, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    if (entry.isFile()) files.push(path.join(PUZZLES_DIR, entry.name));
    else strays.push(path.join(PUZZLES_DIR, entry.name));
  }
  return { files, strays };
}

/** Every problem that would stop a merge: nothing is written. */
async function check(sources: Source[], problems: string[]): Promise<string[]> {
  const out = [...problems];
  const expected = new Set<string>();
  for (const source of sources) {
    try {
      await readable(source.file);
    } catch (error) {
      out.push(`${source.file}: can't be read as an image (${reason(error)}). Replace or remove it.`);
      continue;
    }
    const picture = PICTURES.find((p) => p.id === source.id);
    if (!picture || picture.src !== publicUrl(source.file)) {
      out.push(`${source.file}: has no puzzles yet. Run \`npm run color-tap:puzzles\` and commit what it writes.`);
      continue;
    }
    const bytes = fs.readFileSync(source.file);
    expected.add(fileOf(picture.thumb));
    if (!fs.existsSync(fileOf(picture.thumb))) out.push(`${picture.thumb}: missing. Run \`npm run color-tap:puzzles\`.`);
    LEVELS.forEach((level, i) => {
      const entry = picture.levels[i];
      if (!entry || entry.level !== level.id) {
        out.push(`${source.file}: no ${level.name} puzzle. Run \`npm run color-tap:puzzles\` and commit what it writes.`);
        return;
      }
      expected.add(fileOf(entry.src));
      for (const { id } of entry.retired) {
        const file = versionOf(entry, id);
        expected.add(file);
        try {
          if (decodePuzzle(JSON.parse(fs.readFileSync(file, "utf8"))).id !== id) out.push(`${file}: doesn't hold puzzle ${id}.`);
        } catch (error) {
          out.push(`${file}: a retired ${level.name} puzzle that paintings may be using is missing or unreadable (${reason(error)}).`);
        }
      }
      if (entry.key !== puzzleKey(bytes, level)) out.push(`${source.file}: its ${level.name} puzzle is out of date. Run \`npm run color-tap:puzzles\` and commit what it writes.`);
      try {
        out.push(...puzzleProblems(decodePuzzle(JSON.parse(fs.readFileSync(fileOf(entry.src), "utf8"))), entry, level));
      } catch (error) {
        out.push(`${entry.src}: missing or unreadable (${reason(error)}). Run \`npm run color-tap:puzzles\`.`);
      }
    });
  }
  for (const picture of PICTURES) {
    if (!sources.some((s) => s.id === picture.id)) out.push(`lib/color-tap/pictures.ts: lists "${picture.id}", which is no longer a photo in ${PICTURES_DIR}. Run \`npm run color-tap:puzzles\`.`);
  }
  const { files, strays } = puzzleFiles();
  for (const file of files) if (!expected.has(file)) out.push(`${file}: nothing uses it. Run \`npm run color-tap:puzzles\`.`);
  for (const stray of strays) out.push(`${stray}: only puzzle files belong in ${PUZZLES_DIR}. Remove it.`);
  return out;
}

async function main() {
  const { sources, problems } = scanPictures(PICTURES_DIR, PICTURES.map((p) => p.src));

  if (process.argv.includes("--check")) {
    const found = await check(sources, problems);
    if (found.length > 0) {
      console.error(`Color Tap: ${found.length} problem${found.length === 1 ? "" : "s"} with the photos in ${PICTURES_DIR}:\n${found.map((p) => `  - ${p}`).join("\n")}`);
      process.exit(1);
    }
    console.log(`Color Tap: ${sources.length} photos, every puzzle converted and committed.`);
    return;
  }

  const force = process.argv.includes("--force");
  const started = Date.now();
  fs.mkdirSync(PUZZLES_DIR, { recursive: true });
  const known = new Map(PICTURES.flatMap((p) => p.levels.map((l) => [`${p.id}:${l.level}`, l] as const)));
  const keep = new Set<string>();
  const pictures: PictureInfo[] = [];
  const skipped = [...problems];
  let made = 0;

  for (const source of sources) {
    try {
      const bytes = fs.readFileSync(source.file);
      const { width, height } = await readable(source.file);
      // Named by what it holds (the photo and how it was shrunk), so a cached copy is never stale.
      const thumb = path.join(PUZZLES_DIR, `${source.id}.${hash(JSON.stringify({ photo: hash(bytes, 64), ...THUMB }), 10)}.webp`);
      if (force || !fs.existsSync(thumb)) await sharp(bytes).rotate().resize(THUMB.width).webp({ quality: THUMB.quality }).toFile(thumb);
      const kept = [thumb];

      let picture: Awaited<ReturnType<typeof loadPicture>> | null = null;
      const levels: PictureLevel[] = [];
      for (const level of LEVELS) {
        const key = puzzleKey(bytes, level);
        const old = known.get(`${source.id}:${level.id}`);
        // Earlier puzzles still on disk stay served, for the paintings begun on them.
        const retired = old
          ? [...old.retired, { id: old.id, areas: old.areas }].filter((r, i, all) => all.findIndex((x) => x.id === r.id) === i && fs.existsSync(versionOf(old, r.id)))
          : [];
        if (!force && old && old.key === key && fs.existsSync(fileOf(old.src))) {
          const still = retired.filter((r) => r.id !== old.id);
          levels.push({ ...old, retired: still });
          kept.push(fileOf(old.src), ...still.map((r) => versionOf(old, r.id)));
          continue;
        }
        picture ??= await loadPicture(source.file);
        const t = Date.now();
        const { puzzle, stats } = generate(picture, level, source.id, SEED);
        const id = hash(encodePuzzle(puzzle), 10);
        const file = path.join(PUZZLES_DIR, `${source.id}-${level.id}.${id}.json`);
        const entry: PictureLevel = {
          level: level.id,
          colours: stats.colours,
          areas: stats.areas,
          deltaE: Number(stats.deltaE.toFixed(5)),
          src: publicUrl(file),
          id,
          key,
          retired: retired.filter((r) => r.id !== id),
        };
        const encoded = encodePuzzle({ ...puzzle, id });
        // Checked as the game will read it: labels and points are stored to 1/8 px.
        const broken = puzzleProblems(decodePuzzle(JSON.parse(encoded)), entry, level);
        if (broken.length > 0) throw new Error(`its ${level.name} puzzle breaks the level's promises (${broken.slice(0, 3).join("; ")})`);
        fs.writeFileSync(file, encoded);
        kept.push(file, ...entry.retired.map((r) => (old ? versionOf(old, r.id) : "")).filter(Boolean));
        if (entry.retired.length > (old?.retired.length ?? 0)) console.log(`  ${source.id} ${level.name}: the earlier puzzle stays, retired, for paintings begun on it`);
        made++;
        levels.push(entry);
        console.log(`  ${source.id} ${level.name}: ${stats.colours} colours, ${stats.areas} areas, ΔE ${stats.deltaE.toFixed(4)} (${Date.now() - t} ms)`);
      }
      kept.forEach((file) => keep.add(file));
      pictures.push({ id: source.id, title: source.title, src: publicUrl(source.file), thumb: publicUrl(thumb), width, height, levels });
    } catch (error) {
      // A picture already listed keeps its puzzles, current and retired, as they were: a bad change
      // to its photo, or a failure in this run, never takes away paintings begun on them.
      const listed = PICTURES.find((p) => p.id === source.id);
      if (listed) {
        pictures.push(listed);
        keep.add(fileOf(listed.thumb));
        for (const entry of listed.levels) {
          keep.add(fileOf(entry.src));
          for (const { id } of entry.retired) keep.add(versionOf(entry, id));
        }
      }
      skipped.push(`${source.file}: can't be converted (${reason(error)}).${listed ? " Its earlier puzzles stay." : ""} Replace or remove it.`);
    }
  }

  // Files nothing points at any more: an old version of a puzzle, a photo that was removed. Only
  // plain files are removed; anything else in the folder is reported and left alone.
  const { files, strays } = puzzleFiles();
  for (const file of files) {
    if (keep.has(file)) continue;
    try {
      fs.rmSync(file);
    } catch (error) {
      skipped.push(`${file}: couldn't be removed (${reason(error)}).`);
    }
  }
  for (const stray of strays) skipped.push(`${stray}: only puzzle files belong in ${PUZZLES_DIR}. Remove it.`);

  const manifest = `// GENERATED by scripts/build-color-tap-puzzles.ts (npm run color-tap:puzzles): do not edit by hand.
// The photos in public/paint-by-numbers/ and their puzzles, one per level (DECISIONS.md ADR-022).

import type { PictureInfo } from "./types";

export const PICTURES: readonly PictureInfo[] = ${JSON.stringify(pictures, null, 2)};
`;
  const previous = fs.existsSync(MANIFEST) ? fs.readFileSync(MANIFEST, "utf8") : "";
  if (manifest !== previous) fs.writeFileSync(MANIFEST, manifest);
  const s = ((Date.now() - started) / 1000).toFixed(1);
  console.log(made > 0 ? `Color Tap: made ${made} puzzle${made === 1 ? "" : "s"} for ${pictures.length} photos in ${s} s.` : `Color Tap: ${pictures.length} photos, every puzzle up to date.`);
  if (skipped.length > 0) {
    console.warn(
      `\n⚠ Color Tap left out ${skipped.length} file${skipped.length === 1 ? "" : "s"} (the rest of the site still builds; CI's "Color Tap photos" check fails until ${skipped.length === 1 ? "it is" : "they are"} fixed or removed):\n${skipped.map((p) => `  - ${p}`).join("\n")}\n`,
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
