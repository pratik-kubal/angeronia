// The photos Color Tap paints: every JPG, JPEG or PNG at the top of public/paint-by-numbers/, named
// by its file, and what their puzzles are made from. Shared by the puzzle builder, the preview
// harness, the icon script and the tests.

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import type { Picture } from "../lib/color-tap/generate";
import { contains, regionPolygons } from "../lib/color-tap/geometry";
import { PIPELINE_VERSION, WORK_SIZE, type Level } from "../lib/color-tap/levels";
import type { PictureLevel, Puzzle } from "../lib/color-tap/types";

export const PICTURES_DIR = "public/paint-by-numbers";
export const PUZZLES_DIR = `${PICTURES_DIR}/puzzles`;
export const MANIFEST = "lib/color-tap/pictures.ts";
/** The k-means seed every puzzle is made with. */
export const SEED = 7707;

export const hash = (data: string | Buffer, length: number) => crypto.createHash("sha256").update(data).digest("hex").slice(0, length);

/**
 * What a puzzle is made from, deliberately: the photo, its level's settings, PIPELINE_VERSION, the
 * seed and the work size. When any of these changes, the puzzle is made again. The conversion's
 * code and the image library are not in it on purpose: a comment edit or a routine sharp update
 * must not remake puzzles players are painting (a change that does alter what the conversion makes
 * bumps PIPELINE_VERSION, and the paintings begun on the old puzzles carry on on them, retired).
 */
export function puzzleKey(photo: Buffer, level: Level): string {
  return hash(JSON.stringify({ photo: hash(photo, 64), level, pipeline: PIPELINE_VERSION, seed: SEED, size: WORK_SIZE }), 16);
}

/** A file under public/ as the URL it is served at, each part of its path encoded. */
export function publicUrl(file: string): string {
  return `/${path.relative("public", file).split(path.sep).map(encodeURIComponent).join("/")}`;
}

export interface Source {
  /** From the file name: lower case, accents dropped, anything but letters and digits as dashes. */
  id: string;
  file: string;
  /** The file name as a title: "autumn-leaves.jpg" is "Autumn leaves". */
  title: string;
}

export function idOf(file: string): string {
  return path
    .basename(file, path.extname(file))
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function titleOf(id: string): string {
  const words = id.replace(/-/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

const PHOTO = /\.(jpe?g|png)$/i;
/** Images a phone or an editor might drop in that the conversion doesn't read. */
const OTHER_IMAGE = /\.(heic|heif|webp|avif|gif|tiff?|bmp)$/i;

/**
 * The photos in `dir`, in file-name order, and the ones that can't be used: a name with no Latin
 * letters or digits, one that comes out the same as another photo's ("Leaves.jpg" and
 * "leaves.png"), or an image in a format the conversion doesn't read. On a clash the photo already
 * in `listed` (the manifest's files, by URL) keeps its name, so a newcomer can't take over a
 * picture people are painting.
 */
export function scanPictures(dir: string, listed: readonly string[]): { sources: Source[]; problems: string[] } {
  if (!fs.existsSync(dir)) return { sources: [], problems: [] };
  const entries = fs.readdirSync(dir, { withFileTypes: true }).filter((entry) => entry.isFile() && !entry.name.startsWith("."));
  const problems = entries
    .filter((entry) => OTHER_IMAGE.test(entry.name))
    .map((entry) => `${path.join(dir, entry.name)}: only .jpg, .jpeg and .png photos are converted. Export it as a JPEG.`);
  const files = entries
    .filter((entry) => PHOTO.test(entry.name))
    .map((entry) => path.join(dir, entry.name))
    .sort((a, b) => Number(listed.includes(publicUrl(b))) - Number(listed.includes(publicUrl(a))) || (a < b ? -1 : a > b ? 1 : 0));
  const seen = new Map<string, string>();
  const sources: Source[] = [];
  for (const file of files) {
    const id = idOf(file);
    if (!id) problems.push(`${file}: its name has no Latin letters or digits to name the picture by. Rename it.`);
    else if (seen.has(id)) problems.push(`${file}: its name comes out the same as ${seen.get(id)} ("${id}"). Rename one of them.`);
    else {
      seen.set(id, file);
      sources.push({ id, file, title: titleOf(id) });
    }
  }
  sources.sort((a, b) => (a.file < b.file ? -1 : a.file > b.file ? 1 : 0));
  return { sources, problems };
}

/** A photo at work size (long edge WORK_SIZE px), turned upright by its EXIF tag, transparency on white. */
export async function loadPicture(file: string): Promise<Picture> {
  const { data, info } = await sharp(file)
    .rotate()
    .flatten({ background: "#ffffff" })
    .resize(WORK_SIZE, WORK_SIZE, { fit: "inside", kernel: "mitchell" })
    .toColourspace("srgb")
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  if (info.channels !== 3) throw new Error(`${file}: expected 3 channels, got ${info.channels}`);
  return { rgb: new Uint8Array(data.buffer, data.byteOffset, data.length), width: info.width, height: info.height };
}

/**
 * The promises a puzzle makes a player at its level, broken: too many areas or colours, a colour
 * with no areas, an area too small to find or too thin to tap, a number outside its area, a gap in
 * the picture, or a border its two areas don't both use once. Empty when it keeps them all.
 */
export function puzzleProblems(puzzle: Puzzle, entry: PictureLevel, level: Level): string[] {
  const out: string[] = [];
  const name = `${puzzle.picture} ${level.name}`;
  if (puzzle.id !== entry.id) out.push(`${name}: holds puzzle ${puzzle.id}, not ${entry.id}`);
  if (puzzle.regions.length !== entry.areas || puzzle.palette.length !== entry.colours) out.push(`${name}: doesn't match the manifest's counts`);
  if (puzzle.regions.length > level.maxAreas) out.push(`${name}: ${puzzle.regions.length} areas, more than ${level.maxAreas}`);
  if (puzzle.palette.length > level.colours) out.push(`${name}: ${puzzle.palette.length} colours, more than ${level.colours}`);
  if (new Set(puzzle.regions.map((r) => r.colour)).size !== puzzle.palette.length) out.push(`${name}: a colour has no areas`);
  if (puzzle.regions.reduce((sum, r) => sum + r.area, 0) !== puzzle.width * puzzle.height) out.push(`${name}: its areas don't cover the picture once`);
  const uses = new Map<number, number>();
  puzzle.regions.forEach((region, i) => {
    if (region.area < level.minArea) out.push(`${name}: area ${i} is ${region.area} px, under ${level.minArea}`);
    // Labels are stored to 1/8 px.
    if (region.labels[0].r < level.minRadius - 1 / 8) out.push(`${name}: area ${i} is too thin (radius ${region.labels[0].r})`);
    for (const ring of region.rings) {
      for (const h of ring) {
        const seg = puzzle.segments[h >> 1];
        if (!seg || (h & 1 ? seg.right : seg.left) !== i) out.push(`${name}: area ${i} walks a border that isn't its own`);
        uses.set(h, (uses.get(h) ?? 0) + 1);
      }
    }
    const outline = regionPolygons(puzzle, region, 4);
    region.labels.forEach((label, j) => {
      if (!contains(outline, label.x, label.y)) out.push(`${name}: area ${i}'s number ${j} is outside it`);
    });
  });
  puzzle.segments.forEach((seg, s) => {
    if (seg.left >= 0 && uses.get(2 * s) !== 1) out.push(`${name}: border ${s} isn't used once by its left area`);
    if (seg.right >= 0 && uses.get(2 * s + 1) !== 1) out.push(`${name}: border ${s} isn't used once by its right area`);
  });
  return out;
}
