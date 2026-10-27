// A puzzle as an SVG: the blank sheet (outlines and numbers), the finished painting, or anything
// between. Drawn the way the game's canvas draws it (components/color-tap/renderer.ts, which takes
// its ink and its number sizes from here), so the preview harness, the icon and the tests see what
// a player sees. What only the game shows is left out: the selection, motion, and the faint edges
// painted areas keep until the picture is finished.

import { SvgPath, traceHalf, traceRegion } from "./geometry";
import type { Puzzle } from "./types";

export interface SvgOptions {
  /** Work px → SVG px. */
  scale: number;
  /** The painted areas, by index. */
  painted: ReadonlySet<number>;
  /** Behind the paper, where nothing is drawn (magenta shows up any seam). */
  background: string;
  /** Draw the outlines still to paint and the numbers. */
  sheet: boolean;
}

export const OUTLINE = "#707070";
export const NUMBER = "#595959";
/** A painted area is stroked in its own colour, this wide in work px, so neighbours leave no seam. */
const SEAM = 0.6;
/** The biggest number, in work px. */
const MAX_NUMBER = 16;

/** The number's font size for a label of radius `r` (in the same units): the d-digit box fits the circle. */
export function numberSize(r: number, digits: number): number {
  return (0.85 * 2 * r) / Math.sqrt((0.6 * digits) ** 2 + 0.72 ** 2);
}

export function puzzleSvg(puzzle: Puzzle, options: SvgOptions): string {
  const { scale, painted, background, sheet } = options;
  const w = Math.round(puzzle.width * scale);
  const h = Math.round(puzzle.height * scale);
  const parts: string[] = [`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`, `<rect width="${w}" height="${h}" fill="${background}"/>`];

  // The paper: every area unpainted is white.
  const paper = new SvgPath(scale);
  const byColour = new Map<number, SvgPath>();
  puzzle.regions.forEach((region, i) => {
    if (painted.has(i)) {
      let path = byColour.get(region.colour);
      if (!path) byColour.set(region.colour, (path = new SvgPath(scale)));
      traceRegion(path, puzzle, region);
    } else traceRegion(paper, puzzle, region);
  });
  if (paper.d) parts.push(`<path d="${paper.d}" fill="#ffffff" stroke="#ffffff" stroke-width="${SEAM * scale}"/>`);
  for (const [colour, path] of byColour) {
    const fill = puzzle.palette[colour];
    parts.push(`<path d="${path.d}" fill="${fill}" stroke="${fill}" stroke-width="${SEAM * scale}" stroke-linejoin="round"/>`);
  }

  if (sheet) {
    const lines = new SvgPath(scale);
    puzzle.segments.forEach((seg) => {
      const open = (r: number) => r >= 0 && !painted.has(r);
      if (open(seg.left) || open(seg.right)) traceHalf(lines, seg, false, true);
    });
    if (lines.d) parts.push(`<path d="${lines.d}" fill="none" stroke="${OUTLINE}" stroke-width="${Math.max(1, 0.7 * scale)}" stroke-linejoin="round" stroke-linecap="round"/>`);
    parts.push(`<g fill="${NUMBER}" font-family="Helvetica, Arial, sans-serif" text-anchor="middle">`);
    puzzle.regions.forEach((region, i) => {
      if (painted.has(i)) return;
      const text = String(region.colour + 1);
      for (const label of region.labels) {
        const size = Math.min(numberSize(label.r, text.length), MAX_NUMBER) * scale;
        if (size < 4) continue;
        parts.push(`<text x="${(label.x * scale).toFixed(1)}" y="${(label.y * scale + size * 0.36).toFixed(1)}" font-size="${size.toFixed(1)}">${text}</text>`);
      }
    });
    parts.push("</g>");
  }
  parts.push("</svg>");
  return parts.join("");
}
