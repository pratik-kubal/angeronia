// The exact Euclidean distance transform (Felzenszwalb & Huttenlocher, "Distance Transforms of
// Sampled Functions", 2012): for every pixel, the squared distance to the nearest seed pixel, and
// optionally which seed that is. Two 1-D passes, linear in the pixel count.

const INF = 1e20;

/** The lower envelope of the parabolas rooted at the finite entries of `f[0..n)`. */
function pass(f: Float64Array, n: number, d: Float64Array, arg: Int32Array, v: Int32Array, z: Float64Array) {
  let k = -1;
  for (let q = 0; q < n; q++) {
    if (f[q] >= INF) continue;
    if (k < 0) {
      k = 0;
      v[0] = q;
      z[0] = -Infinity;
      z[1] = Infinity;
      continue;
    }
    // z[0] is -∞, so the first parabola is never dropped and k stays ≥ 0.
    let s = 0;
    for (;;) {
      const p = v[k];
      s = (f[q] + q * q - (f[p] + p * p)) / (2 * q - 2 * p);
      if (s > z[k]) break;
      k--;
    }
    k++;
    v[k] = q;
    z[k] = s;
    z[k + 1] = Infinity;
  }
  if (k < 0) {
    d.fill(INF, 0, n);
    arg.fill(-1, 0, n);
    return;
  }
  let j = 0;
  for (let q = 0; q < n; q++) {
    while (z[j + 1] < q) j++;
    const p = v[j];
    d[q] = (q - p) * (q - p) + f[p];
    arg[q] = p;
  }
}

export interface DistanceMap {
  /** Squared distance from each pixel to the nearest seed (0 on a seed; 1e20 with no seeds at all). */
  d2: Float64Array;
  /** The index of that seed, or -1 with no seeds. */
  nearest: Int32Array;
}

/** The distance transform of a seed mask (`seed[p]` non-zero marks a seed). */
export function distanceMap(seed: Uint8Array, width: number, height: number): DistanceMap {
  const n = Math.max(width, height);
  const f = new Float64Array(n);
  const d = new Float64Array(n);
  const arg = new Int32Array(n);
  const v = new Int32Array(n);
  const z = new Float64Array(n + 1);

  // Columns: the nearest seed in each pixel's own column.
  const col = new Float64Array(width * height);
  const colRow = new Int32Array(width * height);
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) f[y] = seed[y * width + x] ? 0 : INF;
    pass(f, height, d, arg, v, z);
    for (let y = 0; y < height; y++) {
      col[y * width + x] = d[y];
      colRow[y * width + x] = arg[y];
    }
  }
  // Rows: the best column for each pixel, over those column results.
  const d2 = new Float64Array(width * height);
  const nearest = new Int32Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) f[x] = col[y * width + x];
    pass(f, width, d, arg, v, z);
    for (let x = 0; x < width; x++) {
      const p = y * width + x;
      d2[p] = d[x];
      const cx = arg[x];
      nearest[p] = cx < 0 ? -1 : colRow[y * width + cx] * width + cx;
    }
  }
  return { d2, nearest };
}
