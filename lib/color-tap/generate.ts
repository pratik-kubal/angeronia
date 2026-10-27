// A photo to a paint-by-numbers puzzle, step by step (docs/games/color-tap.md):
// OKLab → bilateral smoothing → a palette by weighted k-means → each pixel's nearest colour →
// 3×3 mode filter, twice → thin strips and small areas dissolved, then merged → the palette
// re-estimated from the photo's own pixels → numbered → labels and shared borders.
// Pure and deterministic: the same pixels and level always give the same puzzle.

import { distance, oklabToSrgb, hex, toOklab } from "./color";
import { traceBorders } from "./borders";
import { placeLabels } from "./labels";
import type { Level } from "./levels";
import { assign, quantize } from "./quantize";
import { components, dissolve, paletteColours, mergeSmall, modeFilter, paletteOrder, radii } from "./regions";
import { bilateral } from "./smooth";
import type { Puzzle, Region } from "./types";

/** A picture at work size: 8-bit RGB, row by row. */
export interface Picture {
  rgb: Uint8Array;
  width: number;
  height: number;
}

export interface Stats {
  colours: number;
  areas: number;
  /** The smallest area's size, px. */
  smallestArea: number;
  /** The thinnest area's inscribed radius, px. */
  thinnestRadius: number;
  /** Mean OKLab distance between each pixel of the photo and the colour it is painted. */
  deltaE: number;
  /** How many times the floors were raised to fit under the level's area cap. */
  raises: number;
}

export interface Generated {
  /** The puzzle, with `id` still empty: the build script names it by a hash of its file. */
  puzzle: Puzzle;
  /** Each pixel's palette index, after numbering. */
  colours: Uint8Array;
  /** Each pixel's area. */
  areas: Int32Array;
  stats: Stats;
}

const RADIUS = 3;
const SIGMA_SPACE = 2;
const SIGMA_RANGE = 0.06;
const RAISES = 6;
const AREA_RAISE = 1.15;
const RADIUS_RAISE = 1.07;

/** Merges palette entries closer than `minDistance` (their pixels take the first's index) and drops unused ones. */
function mergeColours(Q: Uint8Array, palette: Float64Array, lab: Float32Array, minDistance: number): { Q: Uint8Array; palette: Float64Array } {
  let current = palette;
  let map = Q;
  for (;;) {
    const k = current.length / 3;
    let a = -1;
    let b = -1;
    let best = minDistance;
    for (let i = 0; i < k; i++) {
      if (Number.isNaN(current[i * 3])) continue;
      for (let j = i + 1; j < k; j++) {
        if (Number.isNaN(current[j * 3])) continue;
        const d = distance(current, i, current, j);
        if (d < best) {
          best = d;
          a = i;
          b = j;
        }
      }
    }
    if (a < 0) break;
    map = map.map((c) => (c === b ? a : c));
    current = paletteColours(map, lab, k);
  }
  return { Q: map, palette: current };
}

interface Cleaned {
  Q: Uint8Array;
  palette: Float64Array;
  /** Palette entries still in use. */
  used: number;
  minRadius: number;
  raises: number;
}

/** Quantise to `k` colours and clean up, raising the floors until the areas fit under the level's cap. */
function clean(lab: Float32Array, smooth: Float32Array, width: number, height: number, level: Level, k: number, seed: number): Cleaned {
  const n = width * height;
  const centres = quantize(smooth, n, k, level.minDistance, seed);
  const colours = centres.length / 3;
  const mode = modeFilter(modeFilter(assign(smooth, n, centres), width, height, colours), width, height, colours);
  let minArea = level.minArea;
  let minRadius = level.minRadius;
  for (let raises = 0; ; raises++) {
    const dissolved = dissolve(mode, smooth, centres, width, height, minArea, minRadius);
    const cleaned = mergeSmall(dissolved, width, height, centres, minArea, minRadius);
    const merged = mergeColours(cleaned, paletteColours(cleaned, lab, colours), lab, level.minDistance);
    if (components(merged.Q, width, height).count <= level.maxAreas || raises === RAISES) {
      let used = 0;
      for (let c = 0; c < colours; c++) if (!Number.isNaN(merged.palette[c * 3])) used++;
      return { ...merged, used, minRadius, raises };
    }
    minArea *= AREA_RAISE;
    minRadius *= RADIUS_RAISE;
  }
}

/** Colours lost to merging or cleanup are asked for again, this many times at most. */
const COLOUR_RETRIES = 3;

export function generate(picture: Picture, level: Level, name: string, seed: number): Generated {
  const { width, height } = picture;
  const n = width * height;
  const lab = toOklab(picture.rgb, n);
  let smooth = lab;
  for (let i = 0; i < level.passes; i++) smooth = bilateral(smooth, width, height, RADIUS, SIGMA_SPACE, SIGMA_RANGE);

  // Near-duplicates merge and a colour can vanish with the small areas it held, so ask for more
  // until the level's count is reached (or stop being closer to it).
  let result = clean(lab, smooth, width, height, level, level.colours, seed);
  for (let retry = 0, k = level.colours; retry < COLOUR_RETRIES && result.used < level.colours; retry++) {
    k += level.colours - result.used;
    const next = clean(lab, smooth, width, height, level, k, seed);
    if (next.used > level.colours) break;
    if (next.used > result.used) result = next;
  }
  const { minRadius, raises } = result;

  // Number the colours that are left, in palette order.
  const { palette: means } = result;
  const k = means.length / 3;
  const used = paletteOrder(means).filter((c) => !Number.isNaN(means[c * 3]));
  const renumber = new Int32Array(k).fill(-1);
  used.forEach((c, i) => (renumber[c] = i));
  const Q = result.Q.map((c) => renumber[c]);
  const paletteLab = new Float64Array(used.length * 3);
  used.forEach((c, i) => paletteLab.set(means.subarray(c * 3, c * 3 + 3), i * 3));
  const palette = used.map((_, i) => hex(...oklabToSrgb(paletteLab[i * 3], paletteLab[i * 3 + 1], paletteLab[i * 3 + 2])));

  const c = components(Q, width, height);
  const { r, max } = radii(c, width, height);
  const labels = placeLabels(c, r, width, minRadius);
  const borders = traceBorders(c.label, width, height, c.count);

  const boxes = Array.from({ length: c.count }, () => [width, height, 0, 0] as [number, number, number, number]);
  for (let p = 0; p < n; p++) {
    const box = boxes[c.label[p]];
    const x = p % width;
    const y = (p - x) / width;
    if (x < box[0]) box[0] = x;
    if (y < box[1]) box[1] = y;
    if (x + 1 > box[2]) box[2] = x + 1;
    if (y + 1 > box[3]) box[3] = y + 1;
  }
  const regions: Region[] = Array.from({ length: c.count }, (_, i) => ({
    colour: c.colour[i],
    area: c.area[i],
    box: boxes[i],
    labels: labels[i],
    rings: borders.rings[i],
  }));

  let error = 0;
  for (let p = 0; p < n; p++) error += distance(lab, p, paletteLab, Q[p]);

  return {
    puzzle: { id: "", picture: name, level: level.id, width, height, palette, regions, segments: borders.segments },
    colours: Q,
    areas: c.label,
    stats: {
      colours: palette.length,
      areas: c.count,
      smallestArea: Math.min(...c.area),
      thinnestRadius: Math.min(...max),
      deltaE: error / n,
      raises,
    },
  };
}
