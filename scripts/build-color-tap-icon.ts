// Makes Color Tap's home-screen icon, app/games/paint-by-numbers/apple-icon.png (180 × 180, opaque,
// full-bleed: iOS rounds the corners itself), from a real puzzle rather than a drawing of one: the
// butterfly at Easy, cropped square round the butterfly (DECISIONS.md ADR-022). The butterfly is
// painted; the leaves behind it are painted on one side of a diagonal and still the blank sheet of
// outlines and numbers on the other, so it reads as a painting in progress even at 60 pt. An area is
// painted or not as a whole, as in the game, so the edge between the halves follows the picture's
// own borders rather than a ruled line.
//
// The paint and the paper are puzzleSvg's (lib/color-tap/render-svg.ts). The outlines and numbers
// are drawn here, with the same geometry, colours and number fit but heavier and fewer: the game's
// are sized for a screen you zoom into, and an icon is seen small, for a moment.
//
// Re-run it when the butterfly's puzzle changes, then `npm run games:icon` for the launcher's icon.
// The output is committed.
//
// Usage: npm run color-tap:icon

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { parseHex, srgbToOklab } from "../lib/color-tap/color";
import { SvgPath, traceHalf } from "../lib/color-tap/geometry";
import { PICTURES } from "../lib/color-tap/pictures";
import { decodePuzzle } from "../lib/color-tap/puzzle";
import { NUMBER, OUTLINE, numberSize, puzzleSvg } from "../lib/color-tap/render-svg";
import type { LevelId, Puzzle } from "../lib/color-tap/types";

const OUT = "app/games/paint-by-numbers/apple-icon.png";
const SIZE = 180;
/** Drawn at 3× and scaled down with Lanczos, so the outlines and numbers keep clean edges. */
const OVERSAMPLE = 3;
const PICTURE = "butterfly";
const LEVEL: LevelId = "easy";

/** The crop's side, as a multiple of the butterfly's longer side: a little of the leaves all round. */
const MARGIN = 1.2;
/**
 * Where the diagonal (bottom left to top right) crosses: this share of the crop's side up and to
 * the left of its centre, so a little more of the sheet is blank than painted.
 */
const SPLIT = 0.05;

/** Outlines this wide, in icon px: a hairline would vanish at 60 pt. */
const LINE = 1.25;
/** Numbers at most this tall, in icon px; one that would be under MIN_NUMBER is left out. */
const MAX_NUMBER = 17;
const MIN_NUMBER = 10;
/** A number is drawn only if it clears the icon's edge by this much, in icon px. */
const INSET = 2;

/** A square on the picture, in work px. */
interface Square {
  x: number;
  y: number;
  side: number;
}

type Box = [number, number, number, number];

/** The committed puzzle for a picture and level, from the manifest, as the game loads it. */
function loadPuzzle(picture: string, level: LevelId): Puzzle {
  const entry = PICTURES.find((p) => p.id === picture)?.levels.find((l) => l.level === level);
  if (!entry) throw new Error(`No ${picture} ${level} puzzle in lib/color-tap/pictures.ts: run npm run color-tap:puzzles`);
  return decodePuzzle(JSON.parse(fs.readFileSync(path.join("public", entry.src), "utf8")));
}

/** A clearly blue colour (an OKLCh hue from azure to violet, and not greyish): the morpho's wings. */
function isBlue(colour: string): boolean {
  const lab = new Float64Array(3);
  const [r, g, b] = parseHex(colour);
  srgbToOklab(r, g, b, lab, 0);
  const hue = ((Math.atan2(lab[2], lab[1]) * 180) / Math.PI + 360) % 360;
  return hue >= 230 && hue <= 320 && Math.hypot(lab[1], lab[2]) >= 0.06;
}

/**
 * The butterfly, found from the puzzle rather than by eye: its blue areas, and the largest area
 * that borders them, which is the dark edge of the wings and the body that holds them.
 */
function butterflyAreas(puzzle: Puzzle): Set<number> {
  const blue = new Set<number>();
  puzzle.regions.forEach((region, i) => {
    if (isBlue(puzzle.palette[region.colour])) blue.add(i);
  });
  if (blue.size === 0) throw new Error(`${puzzle.picture} ${puzzle.level} has no blue areas to find the butterfly by`);
  let frame = -1;
  for (const seg of puzzle.segments) {
    for (const [a, b] of [[seg.left, seg.right], [seg.right, seg.left]]) {
      if (!blue.has(a) || b < 0 || blue.has(b)) continue;
      if (frame < 0 || puzzle.regions[b].area > puzzle.regions[frame].area) frame = b;
    }
  }
  if (frame >= 0) blue.add(frame);
  return blue;
}

/** The box round some areas. */
function boxAround(puzzle: Puzzle, areas: ReadonlySet<number>): Box {
  const boxes = [...areas].map((i) => puzzle.regions[i].box);
  return [
    Math.min(...boxes.map((b) => b[0])),
    Math.min(...boxes.map((b) => b[1])),
    Math.max(...boxes.map((b) => b[2])),
    Math.max(...boxes.map((b) => b[3])),
  ];
}

/** A square centred on `box`, `margin` times its longer side, moved (not shrunk) to stay on the picture. */
function squareAround(box: Box, margin: number, puzzle: Puzzle): Square {
  const side = Math.min(Math.max(box[2] - box[0], box[3] - box[1]) * margin, puzzle.width, puzzle.height);
  const place = (centre: number, max: number) => Math.max(0, Math.min(max - side, centre - side / 2));
  return { x: place((box[0] + box[2]) / 2, puzzle.width), y: place((box[1] + box[3]) / 2, puzzle.height), side };
}

/** The areas whose main number sits up and to the left of the diagonal: the leaves painted so far. */
function paintedSide(puzzle: Puzzle, crop: Square, split: number): Set<number> {
  const cx = crop.x + crop.side / 2;
  const cy = crop.y + crop.side / 2;
  const painted = new Set<number>();
  puzzle.regions.forEach((region, i) => {
    const { x, y } = region.labels[0];
    if ((x - cx + (y - cy)) / crop.side < -split) painted.add(i);
  });
  return painted;
}

/**
 * The blank sheet's outlines and numbers, to lay over the paint: a border is drawn while either
 * side of it is still to paint, as puzzleSvg draws it, but at icon weights. Transparent elsewhere,
 * and the same size as puzzleSvg's picture at `scale` (SVG px per work px).
 */
function sheetSvg(puzzle: Puzzle, painted: ReadonlySet<number>, crop: Square, scale: number): string {
  const w = Math.round(puzzle.width * scale);
  const h = Math.round(puzzle.height * scale);
  const iconScale = SIZE / crop.side; // icon px per work px
  const px = scale / iconScale; // SVG px per icon px
  const parts = [`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`];

  const lines = new SvgPath(scale);
  const open = (r: number) => r >= 0 && !painted.has(r);
  for (const seg of puzzle.segments) if (open(seg.left) || open(seg.right)) traceHalf(lines, seg, false, true);
  if (lines.d) parts.push(`<path d="${lines.d}" fill="none" stroke="${OUTLINE}" stroke-width="${LINE * px}" stroke-linejoin="round" stroke-linecap="round"/>`);

  parts.push(`<g fill="${NUMBER}" font-family="Helvetica, Arial, sans-serif" text-anchor="middle">`);
  puzzle.regions.forEach((region, i) => {
    if (painted.has(i)) return;
    const text = String(region.colour + 1);
    for (const label of region.labels) {
      const size = Math.min(numberSize(label.r, text.length) * iconScale, MAX_NUMBER);
      if (size < MIN_NUMBER) continue;
      // Its box in icon px (a digit is about 0.6 em wide, 0.72 em tall), whole or not at all.
      const x = (label.x - crop.x) * iconScale;
      const y = (label.y - crop.y) * iconScale;
      const halfWidth = 0.3 * size * text.length;
      const halfHeight = 0.36 * size;
      if (x - halfWidth < INSET || x + halfWidth > SIZE - INSET || y - halfHeight < INSET || y + halfHeight > SIZE - INSET) continue;
      const baseline = label.y * scale + halfHeight * px;
      parts.push(`<text x="${(label.x * scale).toFixed(1)}" y="${baseline.toFixed(1)}" font-size="${(size * px).toFixed(1)}">${text}</text>`);
    }
  });
  parts.push("</g></svg>");
  return parts.join("");
}

async function main() {
  const puzzle = loadPuzzle(PICTURE, LEVEL);
  const butterfly = butterflyAreas(puzzle);
  const crop = squareAround(boxAround(puzzle, butterfly), MARGIN, puzzle);
  const painted = new Set([...butterfly, ...paintedSide(puzzle, crop, SPLIT)]);
  const side = SIZE * OVERSAMPLE;
  const scale = side / crop.side; // SVG px per work px

  const paint = puzzleSvg(puzzle, { scale, painted, background: "#ffffff", sheet: false });
  const drawn = await sharp(Buffer.from(paint))
    .composite([{ input: Buffer.from(sheetSvg(puzzle, painted, crop, scale)) }])
    .png()
    .toBuffer();
  // sharp composites last in a pipeline, so the crop, the scaling and the alpha come off in a second
  // pass. The picture is rounded to whole px, so the crop is kept inside it.
  const left = Math.min(Math.round(crop.x * scale), Math.round(puzzle.width * scale) - side);
  const top = Math.min(Math.round(crop.y * scale), Math.round(puzzle.height * scale) - side);
  const icon = await sharp(drawn)
    .extract({ left, top, width: side, height: side })
    .resize(SIZE, SIZE, { kernel: "lanczos3" })
    // Opaque: iOS fills any transparency in a home-screen icon with black.
    .removeAlpha()
    .png({ compressionLevel: 9 })
    .toBuffer();
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, icon);
  console.log(`${puzzle.picture} ${puzzle.level}, ${painted.size} of ${puzzle.regions.length} areas painted → ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
