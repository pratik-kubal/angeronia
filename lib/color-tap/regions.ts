// From a colour-index map to areas a player can find and tap. A mode filter clears single-pixel
// speckle; then, a few rounds over, every pixel in a strip too thin to tap (a morphological opening
// of radius 2) or in an area below the level's floors is dropped and the areas that stay regrow
// into it, each pixel taking the neighbouring colour nearest its own, so an anti-aliased edge band
// splits between its two sides along the photo's own edge; and a last pass merges whatever is still
// too small into its best neighbour, only ever growing areas, so it always ends. An area here is a
// 4-connected run of one colour.

import { distanceMap } from "./edt";

/** One 3×3 majority pass: each pixel takes its neighbourhood's commonest colour (its own on a tie). */
export function modeFilter(Q: Uint8Array, width: number, height: number, colours: number): Uint8Array {
  const out = new Uint8Array(Q.length);
  const counts = new Int32Array(colours);
  const seen = new Int32Array(9);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let n = 0;
      for (let yy = Math.max(0, y - 1); yy <= Math.min(height - 1, y + 1); yy++) {
        for (let xx = Math.max(0, x - 1); xx <= Math.min(width - 1, x + 1); xx++) {
          const c = Q[yy * width + xx];
          if (counts[c]++ === 0) seen[n++] = c;
        }
      }
      const own = Q[y * width + x];
      let best = own;
      let bestCount = counts[own];
      for (let i = 0; i < n; i++) {
        const c = seen[i];
        if (counts[c] > bestCount) {
          best = c;
          bestCount = counts[c];
        }
        counts[c] = 0;
      }
      out[y * width + x] = best;
    }
  }
  return out;
}

export interface Components {
  /** Each pixel's area, numbered in raster order of their first pixel. */
  label: Int32Array;
  count: number;
  area: Int32Array;
  /** Each area's colour. */
  colour: Int32Array;
}

/** The 4-connected areas of one colour. */
export function components(Q: Uint8Array, width: number, height: number): Components {
  const n = width * height;
  const label = new Int32Array(n).fill(-1);
  const stack = new Int32Array(n);
  const areas: number[] = [];
  const colours: number[] = [];
  let count = 0;
  for (let start = 0; start < n; start++) {
    if (label[start] >= 0) continue;
    const c = Q[start];
    const id = count++;
    let top = 0;
    let size = 0;
    stack[top++] = start;
    label[start] = id;
    while (top > 0) {
      const p = stack[--top];
      size++;
      const x = p % width;
      if (x > 0 && label[p - 1] < 0 && Q[p - 1] === c) (label[p - 1] = id), (stack[top++] = p - 1);
      if (x < width - 1 && label[p + 1] < 0 && Q[p + 1] === c) (label[p + 1] = id), (stack[top++] = p + 1);
      if (p >= width && label[p - width] < 0 && Q[p - width] === c) (label[p - width] = id), (stack[top++] = p - width);
      if (p < n - width && label[p + width] < 0 && Q[p + width] === c) (label[p + width] = id), (stack[top++] = p + width);
    }
    areas.push(size);
    colours.push(c);
  }
  return { label, count, area: Int32Array.from(areas), colour: Int32Array.from(colours) };
}

/** Pixels on an area's edge: a 4-neighbour in another area, or the picture's edge. */
export function boundary(label: Int32Array, width: number, height: number): Uint8Array {
  const seed = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const p = y * width + x;
      const l = label[p];
      seed[p] =
        x === 0 || y === 0 || x === width - 1 || y === height - 1 || label[p - 1] !== l || label[p + 1] !== l || label[p - width] !== l || label[p + width] !== l
          ? 1
          : 0;
    }
  }
  return seed;
}

/**
 * Each pixel's inscribed radius, √d + ½ for its squared distance d to the nearest edge pixel (an
 * edge pixel is ½), and each area's largest: the radius of the biggest circle that fits inside it.
 */
export function radii(c: Components, width: number, height: number): { r: Float64Array; max: Float64Array } {
  const d2 = distanceMap(boundary(c.label, width, height), width, height);
  const r = new Float64Array(d2.length);
  const max = new Float64Array(c.count);
  for (let p = 0; p < d2.length; p++) {
    r[p] = Math.sqrt(d2[p]) + 0.5;
    if (r[p] > max[c.label[p]]) max[c.label[p]] = r[p];
  }
  return { r, max };
}

/** The pixel offsets within `radius` of a pixel. */
function disc(radius: number): [number, number][] {
  const out: [number, number][] = [];
  const reach = Math.floor(radius);
  for (let dy = -reach; dy <= reach; dy++) for (let dx = -reach; dx <= reach; dx++) if (dx * dx + dy * dy <= radius * radius) out.push([dx, dy]);
  return out;
}

/** The radius of the opening that strips thin tendrils: anything under about 5 px across. */
const OPENING = 2;
const DISSOLVE_ROUNDS = 6;

/**
 * Gives every dropped pixel a colour by growing the kept ones into them, a ring at a time: each
 * pixel takes, of its kept 4-neighbours' colours, the one nearest its own in `lab`. New borders
 * then follow the photo's edges instead of running straight between the nearest kept pixels.
 */
function regrow(Q: Uint8Array, drop: Uint8Array, lab: Float32Array, palette: Float64Array, width: number, height: number) {
  const n = width * height;
  const kept = new Uint8Array(n);
  for (let p = 0; p < n; p++) kept[p] = drop[p] ? 0 : 1;
  const queued = new Uint8Array(n);
  let frontier: number[] = [];
  const enqueueAround = (p: number, into: number[]) => {
    const x = p % width;
    for (const q of [x > 0 ? p - 1 : -1, x < width - 1 ? p + 1 : -1, p - width, p + width]) {
      if (q < 0 || q >= n || kept[q] || queued[q]) continue;
      queued[q] = 1;
      into.push(q);
    }
  };
  for (let p = 0; p < n; p++) if (kept[p]) enqueueAround(p, frontier);
  const taken = new Uint8Array(n);
  while (frontier.length > 0) {
    frontier.sort((a, b) => a - b);
    for (const p of frontier) {
      const x = p % width;
      let best = -1;
      let bestD = Infinity;
      for (const q of [x > 0 ? p - 1 : -1, x < width - 1 ? p + 1 : -1, p - width, p + width]) {
        if (q < 0 || q >= n || !kept[q]) continue;
        const c = Q[q];
        const dL = lab[p * 3] - palette[c * 3];
        const da = lab[p * 3 + 1] - palette[c * 3 + 1];
        const db = lab[p * 3 + 2] - palette[c * 3 + 2];
        const d = dL * dL + da * da + db * db;
        if (d < bestD || (d === bestD && c < best)) {
          bestD = d;
          best = c;
        }
      }
      taken[p] = best;
    }
    // The whole ring is decided before any of it counts as kept, so the order within it never matters.
    const next: number[] = [];
    for (const p of frontier) {
      Q[p] = taken[p];
      kept[p] = 1;
    }
    for (const p of frontier) enqueueAround(p, next);
    frontier = next;
  }
}

/**
 * Dissolves, a few rounds over, every pixel of a strip thinner than the opening or of an area under
 * `minArea` or `minRadius`, regrowing the areas that stay into them (`lab` and `palette` judge
 * which colour each pixel is nearest).
 */
export function dissolve(mode: Uint8Array, lab: Float32Array, palette: Float64Array, width: number, height: number, minArea: number, minRadius: number): Uint8Array {
  const Q = mode.slice();
  const n = width * height;
  const rho = Math.min(minRadius, OPENING);
  const offsets = disc(rho);
  const centre = new Uint8Array(n);
  const mark = new Uint8Array(n);
  for (let round = 0; round < DISSOLVE_ROUNDS; round++) {
    const c = components(Q, width, height);
    const { r, max } = radii(c, width, height);
    for (let p = 0; p < n; p++) centre[p] = r[p] >= rho ? 1 : 0;
    let marked = 0;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const p = y * width + x;
        const l = c.label[p];
        let drop = c.area[l] < minArea || max[l] < minRadius;
        if (!drop) {
          drop = true;
          for (const [dx, dy] of offsets) {
            const xx = x + dx;
            const yy = y + dy;
            if (xx < 0 || yy < 0 || xx >= width || yy >= height) continue;
            const q = yy * width + xx;
            if (centre[q] && c.label[q] === l) {
              drop = false;
              break;
            }
          }
        }
        mark[p] = drop ? 1 : 0;
        if (drop) marked++;
      }
    }
    if (marked === 0 || marked === n) break;
    regrow(Q, mark, lab, palette, width, height);
  }
  return Q;
}

/** A binary min-heap of [area, id] pairs. */
class Heap {
  private items: [number, number][] = [];
  get size() {
    return this.items.length;
  }
  push(item: [number, number]) {
    const a = this.items;
    a.push(item);
    let i = a.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (!less(a[i], a[parent])) break;
      [a[i], a[parent]] = [a[parent], a[i]];
      i = parent;
    }
  }
  pop(): [number, number] {
    const a = this.items;
    const top = a[0];
    const last = a.pop()!;
    if (a.length > 0) {
      a[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        if (l < a.length && less(a[l], a[m])) m = l;
        if (r < a.length && less(a[r], a[m])) m = r;
        if (m === i) break;
        [a[i], a[m]] = [a[m], a[i]];
        i = m;
      }
    }
    return top;
  }
}
const less = (x: [number, number], y: [number, number]) => x[0] < y[0] || (x[0] === y[0] && x[1] < y[1]);

/**
 * Merges every area under `minArea` or `minRadius`, smallest first, into the neighbour it suits
 * best: alike in colour and sharing much of its edge (ΔE ÷ (¼ + shared edge ÷ perimeter)).
 * Neighbours that come to share a colour fuse. Merging only grows areas (a union's inscribed circle
 * is at least its parts'), so every area that passes keeps passing, and it ends.
 */
export function mergeSmall(Q: Uint8Array, width: number, height: number, palette: Float64Array, minArea: number, minRadius: number): Uint8Array {
  const c = components(Q, width, height);
  const { max } = radii(c, width, height);
  const { label, count } = c;
  const area = Float64Array.from(c.area);
  const colour = c.colour;
  const maxR = Float64Array.from(max);
  const perimeter = new Float64Array(count);
  const nb: Map<number, number>[] = Array.from({ length: count }, () => new Map());
  const touch = (a: number, b: number) => {
    nb[a].set(b, (nb[a].get(b) ?? 0) + 1);
    nb[b].set(a, (nb[b].get(a) ?? 0) + 1);
    perimeter[a]++;
    perimeter[b]++;
  };
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const p = y * width + x;
      const a = label[p];
      if (x + 1 < width && label[p + 1] !== a) touch(a, label[p + 1]);
      if (y + 1 < height && label[p + width] !== a) touch(a, label[p + width]);
      if (x === 0 || x === width - 1) perimeter[a]++;
      if (y === 0 || y === height - 1) perimeter[a]++;
    }
  }
  const parent = new Int32Array(count);
  for (let i = 0; i < count; i++) parent[i] = i;
  const find = (i: number): number => {
    while (parent[i] !== i) {
      parent[i] = parent[parent[i]];
      i = parent[i];
    }
    return i;
  };
  const bad = (r: number) => area[r] < minArea || maxR[r] < minRadius;
  const dE = (a: number, b: number) => {
    const dL = palette[a * 3] - palette[b * 3];
    const da = palette[a * 3 + 1] - palette[b * 3 + 1];
    const db = palette[a * 3 + 2] - palette[b * 3 + 2];
    return Math.sqrt(dL * dL + da * da + db * db);
  };
  /** Area `r` joins `t`, which keeps its colour. */
  const absorb = (t: number, r: number) => {
    parent[r] = t;
    area[t] += area[r];
    maxR[t] = Math.max(maxR[t], maxR[r]);
    perimeter[t] += perimeter[r] - 2 * (nb[t].get(r) ?? 0);
    nb[t].delete(r);
    nb[r].delete(t);
    for (const [u, shared] of nb[r]) {
      nb[t].set(u, (nb[t].get(u) ?? 0) + shared);
      const mu = nb[u];
      mu.set(t, (mu.get(t) ?? 0) + shared);
      mu.delete(r);
    }
    nb[r].clear();
  };

  const heap = new Heap();
  for (let r = 0; r < count; r++) if (bad(r)) heap.push([area[r], r]);
  while (heap.size > 0) {
    const [a, r] = heap.pop();
    if (parent[r] !== r || area[r] !== a || !bad(r) || nb[r].size === 0) continue;
    let target = -1;
    let best = Infinity;
    for (const [t, shared] of nb[r]) {
      const score = dE(colour[r], colour[t]) / (0.25 + shared / perimeter[r]);
      if (score < best || (score === best && t < target)) {
        best = score;
        target = t;
      }
    }
    absorb(target, r);
    // Neighbours of the grown area that share its colour are now one area with it.
    for (;;) {
      let same = -1;
      for (const u of nb[target].keys()) {
        if (colour[u] === colour[target]) {
          same = u;
          break;
        }
      }
      if (same < 0) break;
      absorb(target, same);
    }
    if (bad(target)) heap.push([area[target], target]);
  }
  const out = new Uint8Array(Q.length);
  for (let p = 0; p < out.length; p++) out[p] = colour[find(label[p])];
  return out;
}

const MEDIAN_STEPS = 6;

/**
 * Each palette entry's colour from the photo's own pixels painted with it (NaN for an entry no pixel
 * uses): their geometric median, by Weiszfeld's iteration from their mean. A mean lets a few bright
 * highlights grey a blackberry's black; the median is the colour most of its pixels are, and the one
 * with the least mean ΔE to them.
 */
export function paletteColours(Q: Uint8Array, lab: Float32Array, colours: number): Float64Array {
  const sum = new Float64Array(colours * 3);
  const count = new Float64Array(colours);
  for (let p = 0; p < Q.length; p++) {
    const c = Q[p];
    sum[c * 3] += lab[p * 3];
    sum[c * 3 + 1] += lab[p * 3 + 1];
    sum[c * 3 + 2] += lab[p * 3 + 2];
    count[c]++;
  }
  const out = new Float64Array(colours * 3);
  for (let c = 0; c < colours; c++) for (let t = 0; t < 3; t++) out[c * 3 + t] = count[c] ? sum[c * 3 + t] / count[c] : NaN;
  for (let step = 0; step < MEDIAN_STEPS; step++) {
    sum.fill(0);
    const weight = new Float64Array(colours);
    for (let p = 0; p < Q.length; p++) {
      const c = Q[p];
      const dL = lab[p * 3] - out[c * 3];
      const da = lab[p * 3 + 1] - out[c * 3 + 1];
      const db = lab[p * 3 + 2] - out[c * 3 + 2];
      const w = 1 / Math.max(1e-4, Math.sqrt(dL * dL + da * da + db * db));
      sum[c * 3] += w * lab[p * 3];
      sum[c * 3 + 1] += w * lab[p * 3 + 1];
      sum[c * 3 + 2] += w * lab[p * 3 + 2];
      weight[c] += w;
    }
    for (let c = 0; c < colours; c++) if (count[c]) for (let t = 0; t < 3; t++) out[c * 3 + t] = sum[c * 3 + t] / weight[c];
  }
  return out;
}

/**
 * Palette order: neutrals (OKLCh chroma under 0.03) first, then by hue in twelve 30° groups from
 * red round to pink, light to dark within each, so similar shades sit together in the dock like a
 * paint box. Returns the old indices of the colours in use (a colour merged away or lost to cleanup
 * is NaN, and left out) in their new order.
 */
export function paletteOrder(palette: Float64Array): number[] {
  const k = palette.length / 3;
  const key = (c: number) => {
    const a = palette[c * 3 + 1];
    const b = palette[c * 3 + 2];
    const chroma = Math.hypot(a, b);
    const hue = ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360;
    return { group: chroma < 0.03 ? -1 : Math.floor(hue / 30), L: palette[c * 3] };
  };
  // The unused ones are dropped before the sort: a NaN key makes the comparison inconsistent, and
  // the sort could then leave the colours in use out of order.
  const used = Array.from({ length: k }, (_, c) => c).filter((c) => !Number.isNaN(palette[c * 3]));
  return used.sort((x, y) => {
    const kx = key(x);
    const ky = key(y);
    return kx.group - ky.group || ky.L - kx.L || x - y;
  });
}
