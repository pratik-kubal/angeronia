// The check against the real thing (a paint-by-numbers kit's "before" and "after"): for every photo
// and level, the blank sheet, the finished painting and the photo side by side, plus the numbers
// that say how close the painting comes. Nothing it writes is committed.
//
// Usage: npm run color-tap:preview -- <out dir> [--picture=butterfly] [--level=easy]
//
// For each picture × level it writes <picture>-<level>.png (before | after | photo, work size each),
// <picture>-<level>-before.png and -after.png at 2×, and prints a table: colours, areas, the smallest
// area and radius, mean ΔE (OKLab) of the painting against the photo, seams (pure magenta pixels
// showing through the finished painting at 2×: must be 0) and the time taken.

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { generate } from "../lib/color-tap/generate";
import { LEVELS } from "../lib/color-tap/levels";
import { roundTrip } from "../lib/color-tap/puzzle";
import { puzzleSvg } from "../lib/color-tap/render-svg";
import { PICTURES } from "../lib/color-tap/pictures";
import { PICTURES_DIR, SEED, loadPicture, scanPictures } from "./color-tap-images";

const out = process.argv[2];
if (!out || out.startsWith("--")) throw new Error("Usage: npm run color-tap:preview -- <out dir> [--picture=id] [--level=id]");
const only = (name: string) => process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
fs.mkdirSync(out, { recursive: true });

async function main() {
const rows: Record<string, string | number>[] = [];
for (const source of scanPictures(PICTURES_DIR, PICTURES.map((p) => p.src)).sources) {
  if (only("picture") && only("picture") !== source.id) continue;
  const picture = await loadPicture(source.file);
  const photo = await sharp(Buffer.from(picture.rgb), { raw: { width: picture.width, height: picture.height, channels: 3 } }).png().toBuffer();
  for (const level of LEVELS) {
    if (only("level") && only("level") !== level.id) continue;
    const started = performance.now();
    const generated = generate(picture, level, source.id, SEED);
    const ms = Math.round(performance.now() - started);
    const puzzle = roundTrip(generated.puzzle);
    const all = new Set(puzzle.regions.map((_, i) => i));
    const none = new Set<number>();
    const svg = (painted: Set<number>, scale: number, background: string, sheet: boolean) => Buffer.from(puzzleSvg(puzzle, { scale, painted, background, sheet }));

    const before = await sharp(svg(none, 1, "#ffffff", true)).png().toBuffer();
    const after = await sharp(svg(all, 1, "#ffffff", false)).png().toBuffer();
    const name = `${source.id}-${level.id}`;
    await sharp({ create: { width: picture.width * 3 + 16, height: picture.height, channels: 3, background: "#1c2133" } })
      .composite([
        { input: before, left: 0, top: 0 },
        { input: after, left: picture.width + 8, top: 0 },
        { input: photo, left: picture.width * 2 + 16, top: 0 },
      ])
      .png()
      .toFile(path.join(out, `${name}.png`));
    await sharp(svg(none, 2, "#ffffff", true)).png().toFile(path.join(out, `${name}-before.png`));
    await sharp(svg(all, 2, "#ffffff", false)).png().toFile(path.join(out, `${name}-after.png`));

    const seams = await sharp(svg(all, 2, "#ff00ff", false)).raw().toBuffer({ resolveWithObject: true });
    let magenta = 0;
    for (let i = 0; i < seams.data.length; i += seams.info.channels) {
      if (seams.data[i] === 255 && seams.data[i + 1] === 0 && seams.data[i + 2] === 255) magenta++;
    }
    const s = generated.stats;
    rows.push({
      picture: source.id,
      level: level.id,
      colours: `${s.colours}/${level.colours}`,
      areas: s.areas,
      cap: level.maxAreas,
      smallest: s.smallestArea,
      thinnest: Number(s.thinnestRadius.toFixed(2)),
      deltaE: Number(s.deltaE.toFixed(4)),
      raises: s.raises,
      segments: puzzle.segments.length,
      seams: magenta,
      ms,
    });
    console.log(rows[rows.length - 1]);
  }
}
console.table(rows);
fs.writeFileSync(path.join(out, "metrics.json"), JSON.stringify(rows, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
