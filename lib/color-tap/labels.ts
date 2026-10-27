// Where the numbers go. An area's number sits at its pole of inaccessibility, the pixel farthest
// from its edge (on a tie, the one nearest its centroid), sized by the circle that fits there. A
// long area also gets a few more numbers along it, at least four radii apart, so one is in view
// wherever the player zooms in.

import type { Components } from "./regions";
import type { Label } from "./types";

/** An area this many times its main radius squared or larger is long enough for extra numbers. */
const LONG = 40;
const SPACING = 4;
const MAX_EXTRA = 6;

export function placeLabels(c: Components, r: Float64Array, width: number, minRadius: number): Label[][] {
  const { label, count } = c;
  const sx = new Float64Array(count);
  const sy = new Float64Array(count);
  for (let p = 0; p < label.length; p++) {
    sx[label[p]] += p % width;
    sy[label[p]] += Math.floor(p / width);
  }
  const best = new Int32Array(count).fill(-1);
  const bestD = new Float64Array(count);
  for (let p = 0; p < label.length; p++) {
    const l = label[p];
    const cx = sx[l] / c.area[l];
    const cy = sy[l] / c.area[l];
    const d = ((p % width) - cx) ** 2 + (Math.floor(p / width) - cy) ** 2;
    if (best[l] < 0 || r[p] > r[best[l]] || (r[p] === r[best[l]] && d < bestD[l])) {
      best[l] = p;
      bestD[l] = d;
    }
  }
  const out: Label[][] = Array.from({ length: count }, (_, l) => {
    const p = best[l];
    return [{ x: (p % width) + 0.5, y: Math.floor(p / width) + 0.5, r: r[p] }];
  });

  // Long areas: the deepest pixel in each cell of a grid 4 radii wide, then greedily the deepest
  // of those that keep their distance from every number already placed.
  const cells = new Map<number, Map<number, number>>();
  for (let l = 0; l < count; l++) if (c.area[l] > LONG * out[l][0].r ** 2) cells.set(l, new Map());
  if (cells.size === 0) return out;
  for (let p = 0; p < label.length; p++) {
    const grid = cells.get(label[p]);
    if (!grid) continue;
    const size = SPACING * out[label[p]][0].r;
    const key = Math.floor((p % width) / size) * 65536 + Math.floor(Math.floor(p / width) / size);
    const held = grid.get(key);
    if (held === undefined || r[p] > r[held]) grid.set(key, p);
  }
  for (const [l, grid] of cells) {
    const main = out[l][0];
    const floor = Math.max(minRadius, 0.6 * main.r);
    const candidates = [...grid.values()].filter((p) => r[p] >= floor).sort((a, b) => r[b] - r[a] || a - b);
    for (const p of candidates) {
      if (out[l].length > MAX_EXTRA) break;
      const x = (p % width) + 0.5;
      const y = Math.floor(p / width) + 0.5;
      const gap = SPACING * main.r;
      if (out[l].every((q) => (q.x - x) ** 2 + (q.y - y) ** 2 >= gap * gap)) out[l].push({ x, y, r: r[p] });
    }
  }
  return out;
}
