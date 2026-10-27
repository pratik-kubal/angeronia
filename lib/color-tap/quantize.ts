// Finding the palette: weighted k-means in OKLab over a histogram of the picture's colours. Each
// occupied bin counts as count^0.65 rather than its full count, so a large soft background can't
// take every colour and small distinct details (the morpho's white spots, a berry's highlight) keep
// one of their own. k-means++ starts it, seeded, best of three runs. Colours a player couldn't tell
// apart are merged, and the worst-fitting colour split, so the palette stays near the size asked for.

import { mulberry32 } from "../random";

const L_BINS = 64;
const AB_BINS = 81;
const AB_MIN = -0.4;
const AB_STEP = 0.8 / (AB_BINS - 1);
const WEIGHT_POWER = 0.65;
const MAX_ITERATIONS = 30;
const MIN_SHIFT = 1e-4;
const RUNS = 3;

/** The occupied histogram bins: each one's mean colour and its weight. */
interface Points {
  lab: Float64Array;
  weight: Float64Array;
  n: number;
}

function histogram(lab: Float32Array, pixels: number): Points {
  const bins = new Map<number, number>();
  const sums: number[] = [];
  for (let p = 0; p < pixels; p++) {
    const L = lab[p * 3];
    const a = lab[p * 3 + 1];
    const b = lab[p * 3 + 2];
    const iL = Math.min(L_BINS - 1, Math.max(0, Math.floor(L * L_BINS)));
    const ia = Math.min(AB_BINS - 1, Math.max(0, Math.round((a - AB_MIN) / AB_STEP)));
    const ib = Math.min(AB_BINS - 1, Math.max(0, Math.round((b - AB_MIN) / AB_STEP)));
    const key = (iL * AB_BINS + ia) * AB_BINS + ib;
    let slot = bins.get(key);
    if (slot === undefined) {
      slot = sums.length;
      bins.set(key, slot);
      sums.push(0, 0, 0, 0);
    }
    sums[slot] += L;
    sums[slot + 1] += a;
    sums[slot + 2] += b;
    sums[slot + 3] += 1;
  }
  // Bins in key order, so the result never depends on the order pixels were seen in.
  const keys = [...bins.keys()].sort((x, y) => x - y);
  const n = keys.length;
  const points = { lab: new Float64Array(n * 3), weight: new Float64Array(n), n };
  keys.forEach((key, i) => {
    const slot = bins.get(key)!;
    const count = sums[slot + 3];
    points.lab[i * 3] = sums[slot] / count;
    points.lab[i * 3 + 1] = sums[slot + 1] / count;
    points.lab[i * 3 + 2] = sums[slot + 2] / count;
    points.weight[i] = count ** WEIGHT_POWER;
  });
  return points;
}

function d2(a: Float64Array, i: number, b: Float64Array, j: number): number {
  const dL = a[i * 3] - b[j * 3];
  const da = a[i * 3 + 1] - b[j * 3 + 1];
  const db = a[i * 3 + 2] - b[j * 3 + 2];
  return dL * dL + da * da + db * db;
}

function nearest(points: Points, i: number, centers: Float64Array, k: number): { c: number; d: number } {
  let best = 0;
  let bestD = Infinity;
  for (let c = 0; c < k; c++) {
    const d = d2(points.lab, i, centers, c);
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }
  return { c: best, d: bestD };
}

/** Each colour's weight, mean and weighted squared error, from the points nearest it. */
interface Fit {
  centers: Float64Array;
  k: number;
  weight: Float64Array;
  error: Float64Array;
  sse: number;
}

function fit(points: Points, centers: Float64Array, k: number): Fit {
  const weight = new Float64Array(k);
  const error = new Float64Array(k);
  let sse = 0;
  for (let i = 0; i < points.n; i++) {
    const { c, d } = nearest(points, i, centers, k);
    weight[c] += points.weight[i];
    error[c] += points.weight[i] * d;
    sse += points.weight[i] * d;
  }
  return { centers, k, weight, error, sse };
}

/** Lloyd's iterations until no colour moves more than MIN_SHIFT; an emptied colour restarts on the worst-fitted point. */
function lloyd(points: Points, start: Float64Array, k: number, iterations: number): Fit {
  let centers = start.slice(0, k * 3);
  for (let it = 0; it < iterations; it++) {
    const sum = new Float64Array(k * 3);
    const weight = new Float64Array(k);
    let worst = -1;
    let worstCost = -1;
    for (let i = 0; i < points.n; i++) {
      const { c, d } = nearest(points, i, centers, k);
      const w = points.weight[i];
      weight[c] += w;
      sum[c * 3] += w * points.lab[i * 3];
      sum[c * 3 + 1] += w * points.lab[i * 3 + 1];
      sum[c * 3 + 2] += w * points.lab[i * 3 + 2];
      if (w * d > worstCost) {
        worstCost = w * d;
        worst = i;
      }
    }
    const next = new Float64Array(k * 3);
    let shift = 0;
    for (let c = 0; c < k; c++) {
      if (weight[c] > 0) {
        next[c * 3] = sum[c * 3] / weight[c];
        next[c * 3 + 1] = sum[c * 3 + 1] / weight[c];
        next[c * 3 + 2] = sum[c * 3 + 2] / weight[c];
      } else {
        next.set(points.lab.subarray(worst * 3, worst * 3 + 3), c * 3);
      }
      shift = Math.max(shift, Math.sqrt(d2(next, c, centers, c)));
    }
    centers = next;
    if (shift < MIN_SHIFT) break;
  }
  return fit(points, centers, k);
}

/** k-means++: each next colour is a point picked with odds of its weight times its squared distance to the nearest colour so far. */
function seedCenters(points: Points, k: number, rng: () => number): Float64Array {
  const centers = new Float64Array(k * 3);
  const pick = (odds: Float64Array): number => {
    let total = 0;
    for (let i = 0; i < points.n; i++) total += odds[i];
    let r = rng() * total;
    for (let i = 0; i < points.n; i++) {
      r -= odds[i];
      if (r <= 0) return i;
    }
    return points.n - 1;
  };
  const first = pick(points.weight);
  centers.set(points.lab.subarray(first * 3, first * 3 + 3), 0);
  const dist = new Float64Array(points.n).fill(Infinity);
  const odds = new Float64Array(points.n);
  for (let c = 1; c < k; c++) {
    for (let i = 0; i < points.n; i++) {
      dist[i] = Math.min(dist[i], d2(points.lab, i, centers, c - 1));
      odds[i] = points.weight[i] * dist[i];
    }
    const next = pick(odds);
    centers.set(points.lab.subarray(next * 3, next * 3 + 3), c * 3);
  }
  return centers;
}

/** Merges the closest pair of colours, weighted, while any two are closer than `minDistance`. */
function mergeClose(points: Points, start: Fit, minDistance: number): Fit {
  let current = start;
  for (;;) {
    const { centers, k, weight } = current;
    let a = -1;
    let b = -1;
    let best = minDistance * minDistance;
    for (let i = 0; i < k; i++) {
      for (let j = i + 1; j < k; j++) {
        const d = d2(centers, i, centers, j);
        if (d < best) {
          best = d;
          a = i;
          b = j;
        }
      }
    }
    if (a < 0) return current;
    const wa = weight[a] || 1e-9;
    const wb = weight[b] || 1e-9;
    const next = new Float64Array((k - 1) * 3);
    let o = 0;
    for (let c = 0; c < k; c++) {
      if (c === b) continue;
      if (c === a) {
        for (let t = 0; t < 3; t++) next[o * 3 + t] = (centers[a * 3 + t] * wa + centers[b * 3 + t] * wb) / (wa + wb);
      } else {
        next.set(centers.subarray(c * 3, c * 3 + 3), o * 3);
      }
      o++;
    }
    current = fit(points, next, k - 1);
  }
}

/** Splits the colour with the largest weighted error in two, along its widest axis. */
function splitWorst(points: Points, current: Fit): Fit {
  const { centers, k, error } = current;
  let worst = 0;
  for (let c = 1; c < k; c++) if (error[c] > error[worst]) worst = c;
  const mean = [centers[worst * 3], centers[worst * 3 + 1], centers[worst * 3 + 2]];
  const variance = [0, 0, 0];
  let total = 0;
  for (let i = 0; i < points.n; i++) {
    if (nearest(points, i, centers, k).c !== worst) continue;
    const w = points.weight[i];
    total += w;
    for (let t = 0; t < 3; t++) variance[t] += w * (points.lab[i * 3 + t] - mean[t]) ** 2;
  }
  const axis = variance.indexOf(Math.max(...variance));
  const spread = total > 0 ? Math.sqrt(variance[axis] / total) / 2 : 0.01;
  const next = new Float64Array((k + 1) * 3);
  next.set(centers, 0);
  next.set(mean, k * 3);
  next[worst * 3 + axis] -= spread;
  next[k * 3 + axis] += spread;
  return fit(points, next, k + 1);
}

/**
 * The palette for a packed OKLab image: at most `k` colours, no two closer than `minDistance`.
 * Deterministic for a given `seed`.
 */
export function quantize(lab: Float32Array, pixels: number, k: number, minDistance: number, seed: number): Float64Array {
  const points = histogram(lab, pixels);
  const target = Math.min(k, points.n);
  let best: Fit | null = null;
  for (let run = 0; run < RUNS; run++) {
    const result = lloyd(points, seedCenters(points, target, mulberry32(seed + run * 7919)), target, MAX_ITERATIONS);
    if (!best || result.sse < best.sse) best = result;
  }
  let current = best!;
  for (let round = 0; round < 3; round++) {
    current = mergeClose(points, current, minDistance);
    if (current.k >= target || round === 2) break;
    while (current.k < target) current = splitWorst(points, current);
    current = lloyd(points, current.centers, current.k, 10);
  }
  return mergeClose(points, current, minDistance).centers;
}

/** Each pixel's nearest palette colour. */
export function assign(lab: Float32Array, pixels: number, palette: Float64Array): Uint8Array {
  const k = palette.length / 3;
  const out = new Uint8Array(pixels);
  for (let p = 0; p < pixels; p++) {
    const L = lab[p * 3];
    const a = lab[p * 3 + 1];
    const b = lab[p * 3 + 2];
    let best = 0;
    let bestD = Infinity;
    for (let c = 0; c < k; c++) {
      const dL = L - palette[c * 3];
      const da = a - palette[c * 3 + 1];
      const db = b - palette[c * 3 + 2];
      const d = dL * dL + da * da + db * db;
      if (d < bestD) {
        bestD = d;
        best = c;
      }
    }
    out[p] = best;
  }
  return out;
}
