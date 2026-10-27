// Edge-preserving smoothing before the colours are found: a bilateral filter in OKLab averages each
// pixel with its neighbours, weighted by how near they are and how alike in colour, so JPEG noise
// and fine texture (the berries' drupelets, a leaf's grain) flatten while real edges stay sharp.

const RANGE_STEPS = 1024;

/**
 * One bilateral pass over a packed OKLab image: a (2·radius + 1)² window, spatial σ `sigmaSpace`
 * px, range σ `sigmaRange` in OKLab. Colours further apart than 4σ count for nothing.
 */
export function bilateral(lab: Float32Array, width: number, height: number, radius: number, sigmaSpace: number, sigmaRange: number): Float32Array {
  const side = 2 * radius + 1;
  const spatial = new Float64Array(side * side);
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      spatial[(dy + radius) * side + dx + radius] = Math.exp(-(dx * dx + dy * dy) / (2 * sigmaSpace * sigmaSpace));
    }
  }
  const maxD2 = 16 * sigmaRange * sigmaRange;
  const range = new Float64Array(RANGE_STEPS);
  for (let i = 0; i < RANGE_STEPS; i++) range[i] = Math.exp(-((i / (RANGE_STEPS - 1)) * maxD2) / (2 * sigmaRange * sigmaRange));
  const toStep = (RANGE_STEPS - 1) / maxD2;

  const out = new Float32Array(lab.length);
  for (let y = 0; y < height; y++) {
    const y0 = Math.max(0, y - radius);
    const y1 = Math.min(height - 1, y + radius);
    for (let x = 0; x < width; x++) {
      const x0 = Math.max(0, x - radius);
      const x1 = Math.min(width - 1, x + radius);
      const c = (y * width + x) * 3;
      const L = lab[c];
      const A = lab[c + 1];
      const B = lab[c + 2];
      let sw = 0;
      let sL = 0;
      let sA = 0;
      let sB = 0;
      for (let yy = y0; yy <= y1; yy++) {
        const row = (yy - y + radius) * side + radius - x;
        for (let xx = x0; xx <= x1; xx++) {
          const q = (yy * width + xx) * 3;
          const dL = lab[q] - L;
          const dA = lab[q + 1] - A;
          const dB = lab[q + 2] - B;
          const d2 = dL * dL + dA * dA + dB * dB;
          if (d2 >= maxD2) continue;
          const w = spatial[row + xx] * range[(d2 * toStep) | 0];
          sw += w;
          sL += w * lab[q];
          sA += w * lab[q + 1];
          sB += w * lab[q + 2];
        }
      }
      out[c] = sL / sw;
      out[c + 1] = sA / sw;
      out[c + 2] = sB / sw;
    }
  }
  return out;
}
