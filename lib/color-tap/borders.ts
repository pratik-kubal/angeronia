// The outlines. Borders run along the cracks between pixels, on the lattice of pixel corners. Each
// stretch between two junctions (a corner where three or more areas meet, or a corner of the
// picture) is one segment with one area on its left and one on its right; it is traced once,
// smoothed once and drawn by both, so neighbouring areas can never gap or overlap. An area's rings
// are its segments chained end to end. Smoothing keeps the junctions pinned: the pixel-edge
// midpoints, thinned by Douglas–Peucker, become the control polygon of a quadratic B-spline.

import type { Segment } from "./types";

/** Directions on the lattice, y down: east, south, west, north (each a quarter turn clockwise). */
const DX = [1, 0, -1, 0];
const DY = [0, 1, 0, -1];
/** How far a smoothed border may stray from its pixel crack, in px. */
const TOLERANCE = 0.55;

export interface Borders {
  segments: Segment[];
  /** Per area: its rings as half-segment references (2s forwards, 2s + 1 backwards), outer first. */
  rings: number[][][];
  /**
   * Per segment, its exact share of twice the signed area of any ring it is walked forwards in, from
   * its pixel cracks (before smoothing): a ring's shares sum to −2 × its area for an outer ring.
   */
  cross: number[];
}

export function traceBorders(label: Int32Array, width: number, height: number, areas: number): Borders {
  const VW = width + 1;
  const lab = (x: number, y: number) => (x < 0 || y < 0 || x >= width || y >= height ? -1 : label[y * width + x]);
  const leftOf = (x: number, y: number, d: number) => (d === 0 ? lab(x, y - 1) : d === 1 ? lab(x, y) : d === 2 ? lab(x - 1, y) : lab(x - 1, y - 1));
  const rightOf = (x: number, y: number, d: number) => (d === 0 ? lab(x, y) : d === 1 ? lab(x - 1, y) : d === 2 ? lab(x - 1, y - 1) : lab(x, y - 1));
  const present = (x: number, y: number, d: number) => {
    const nx = x + DX[d];
    const ny = y + DY[d];
    if (nx < 0 || ny < 0 || nx > width || ny > height) return false;
    return leftOf(x, y, d) !== rightOf(x, y, d);
  };
  const HE = width * (height + 1);
  const edgeId = (x: number, y: number, d: number) =>
    d === 0 ? y * width + x : d === 2 ? y * width + x - 1 : d === 1 ? HE + y * VW + x : HE + (y - 1) * VW + x;
  const visited = new Uint8Array(HE + VW * height);

  const junction = new Uint8Array(VW * (height + 1));
  for (let y = 0; y <= height; y++) {
    for (let x = 0; x <= width; x++) {
      const a = lab(x - 1, y - 1);
      const b = lab(x, y - 1);
      const c = lab(x - 1, y);
      const d = lab(x, y);
      const degree = Number(a !== b) + Number(c !== d) + Number(a !== c) + Number(b !== d);
      const corner = (x === 0 || x === width) && (y === 0 || y === height);
      junction[y * VW + x] = degree >= 3 || corner ? 1 : 0;
    }
  }

  // Raw segments: lattice points, the pair of areas, the first and last step, and 2× signed area.
  const raw: { pts: number[]; left: number; right: number; closed: boolean; first: number; last: number; cross: number; start: number; end: number }[] = [];
  const trace = (x0: number, y0: number, d0: number, loop: boolean) => {
    const pts = [x0, y0];
    let x = x0;
    let y = y0;
    let d = d0;
    let cross = 0;
    for (;;) {
      visited[edgeId(x, y, d)] = 1;
      const nx = x + DX[d];
      const ny = y + DY[d];
      cross += x * ny - nx * y;
      x = nx;
      y = ny;
      pts.push(x, y);
      if (loop ? x === x0 && y === y0 : junction[y * VW + x] === 1) break;
      // A corner with exactly two cracks: the one that isn't the way back.
      const back = (d + 2) & 3;
      let next = -1;
      for (const turn of [(d + 3) & 3, d, (d + 1) & 3]) {
        if (turn !== back && present(x, y, turn)) {
          next = turn;
          break;
        }
      }
      if (next < 0) throw new Error(`Border lost at ${x},${y}`);
      d = next;
    }
    raw.push({ pts, left: leftOf(x0, y0, d0), right: rightOf(x0, y0, d0), closed: loop, first: d0, last: d, cross, start: y0 * VW + x0, end: y * VW + x });
  };
  for (let y = 0; y <= height; y++) {
    for (let x = 0; x <= width; x++) {
      if (!junction[y * VW + x]) continue;
      for (let d = 0; d < 4; d++) if (present(x, y, d) && !visited[edgeId(x, y, d)]) trace(x, y, d, false);
    }
  }
  // What's left are islands: closed loops with no junction. Start each at its top-left crack.
  for (let y = 0; y <= height; y++) {
    for (let x = 0; x < width; x++) if (present(x, y, 0) && !visited[edgeId(x, y, 0)]) trace(x, y, 0, true);
  }

  // Rings: each area chains the halves it owns (forwards where it is the left side, backwards where
  // it is the right). At a corner it touches twice, the left turn keeps hugging the same pixel.
  const owned: number[][] = Array.from({ length: areas }, () => []);
  raw.forEach((s, i) => {
    if (s.left >= 0) owned[s.left].push(2 * i);
    if (s.right >= 0) owned[s.right].push(2 * i + 1);
  });
  const startOf = (h: number) => (h & 1 ? raw[h >> 1].end : raw[h >> 1].start);
  const endOf = (h: number) => (h & 1 ? raw[h >> 1].start : raw[h >> 1].end);
  const outDir = (h: number) => (h & 1 ? (raw[h >> 1].last + 2) & 3 : raw[h >> 1].first);
  const inDir = (h: number) => (h & 1 ? (raw[h >> 1].first + 2) & 3 : raw[h >> 1].last);
  const used = new Uint8Array(raw.length * 2);
  const rings: number[][][] = owned.map((halves, region) => {
    const from = new Map<number, number[]>();
    for (const h of halves) {
      const v = startOf(h);
      const list = from.get(v);
      if (list) list.push(h);
      else from.set(v, [h]);
    }
    const found: { ring: number[]; area2: number }[] = [];
    for (const h0 of halves) {
      if (used[h0]) continue;
      used[h0] = 1;
      const ring = [h0];
      if (!raw[h0 >> 1].closed) {
        for (let cur = h0; ; ) {
          const options = (from.get(endOf(cur)) ?? []).filter((h) => !used[h] || h === h0);
          if (options.length === 0) throw new Error(`Area ${region}: ring does not close`);
          let next = options[0];
          if (options.length > 1) {
            const d = inDir(cur);
            const rank = (h: number) => [(d + 3) & 3, d, (d + 1) & 3].indexOf(outDir(h));
            next = options.reduce((best, h) => (rank(h) >= 0 && (rank(best) < 0 || rank(h) < rank(best)) ? h : best));
          }
          if (next === h0) break;
          used[next] = 1;
          ring.push(next);
          cur = next;
        }
      }
      const area2 = ring.reduce((sum, h) => sum + (h & 1 ? -raw[h >> 1].cross : raw[h >> 1].cross), 0);
      found.push({ ring, area2 });
    }
    // y down with the area on the left: the outer ring winds negative, holes positive.
    found.sort((a, b) => a.area2 - b.area2);
    return found.map((f) => f.ring);
  });

  const segments: Segment[] = raw.map((s) => ({ left: s.left, right: s.right, closed: s.closed, points: smooth(s.pts, s.closed) }));
  return { segments, rings, cross: raw.map((s) => s.cross) };
}

/** A lattice path's pixel-edge midpoints (its ends kept on open paths), without collinear runs, thinned by Douglas–Peucker. */
export function smooth(lattice: number[], closed: boolean): Float32Array {
  const n = lattice.length / 2 - (closed ? 1 : 0);
  const mids: number[] = [];
  if (!closed) mids.push(lattice[0], lattice[1]);
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const j = (i + 1) % (closed ? n : n + 1);
    mids.push((lattice[i * 2] + lattice[j * 2]) / 2, (lattice[i * 2 + 1] + lattice[j * 2 + 1]) / 2);
  }
  if (!closed) mids.push(lattice[(n - 1) * 2], lattice[(n - 1) * 2 + 1]);

  const m = mids.length / 2;
  const keep = new Uint8Array(m);
  if (!closed) {
    keep[0] = 1;
    keep[m - 1] = 1;
    simplify(mids, 0, m - 1, keep);
  } else {
    // Split the loop at its first point and the point farthest from it.
    let far = 0;
    let farD = -1;
    for (let i = 1; i < m; i++) {
      const d = (mids[i * 2] - mids[0]) ** 2 + (mids[i * 2 + 1] - mids[1]) ** 2;
      if (d > farD) {
        farD = d;
        far = i;
      }
    }
    keep[0] = 1;
    keep[far] = 1;
    simplify(mids, 0, far, keep);
    const wrapped = mids.concat(mids[0], mids[1]);
    const keepWrapped = new Uint8Array(m + 1);
    simplify(wrapped, far, m, keepWrapped);
    for (let i = far + 1; i < m; i++) if (keepWrapped[i]) keep[i] = 1;
    // A loop needs three points to stay a shape.
    if (keep.reduce((a, b) => a + b, 0) < 3) {
      keep[Math.floor(m / 3)] = 1;
      keep[Math.floor((2 * m) / 3)] = 1;
    }
  }
  const out: number[] = [];
  for (let i = 0; i < m; i++) if (keep[i]) out.push(mids[i * 2], mids[i * 2 + 1]);
  return Float32Array.from(out);
}

/** Douglas–Peucker between points `a` and `b` (kept), marking the points that stay. */
function simplify(pts: number[], a: number, b: number, keep: Uint8Array) {
  const stack: [number, number][] = [[a, b]];
  while (stack.length > 0) {
    const [i, j] = stack.pop()!;
    if (j - i < 2) continue;
    const ax = pts[i * 2];
    const ay = pts[i * 2 + 1];
    const bx = pts[j * 2];
    const by = pts[j * 2 + 1];
    const len = Math.hypot(bx - ax, by - ay);
    let far = -1;
    let farD = TOLERANCE;
    for (let k = i + 1; k < j; k++) {
      const px = pts[k * 2];
      const py = pts[k * 2 + 1];
      const d = len === 0 ? Math.hypot(px - ax, py - ay) : Math.abs((bx - ax) * (ay - py) - (ax - px) * (by - ay)) / len;
      if (d > farD) {
        farD = d;
        far = k;
      }
    }
    if (far < 0) continue;
    keep[far] = 1;
    stack.push([i, far], [far, j]);
  }
}
