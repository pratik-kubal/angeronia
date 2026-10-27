// Colour maths in OKLab (Björn Ottosson, 2020): perceptually even enough that a distance between two
// colours means the same anywhere, which matters for the morpho's blues, where CIELAB's hue drifts.

/** sRGB 8-bit to linear light, by table. */
const TO_LINEAR = new Float64Array(256);
for (let i = 0; i < 256; i++) {
  const c = i / 255;
  TO_LINEAR[i] = c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** Writes the OKLab of an 8-bit sRGB colour at `out[o..o+2]`. */
export function srgbToOklab(r: number, g: number, b: number, out: Float32Array | Float64Array, o: number) {
  const lr = TO_LINEAR[r];
  const lg = TO_LINEAR[g];
  const lb = TO_LINEAR[b];
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  out[o] = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  out[o + 1] = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  out[o + 2] = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
}

function toSrgb8(linear: number): number {
  const c = linear <= 0.0031308 ? 12.92 * linear : 1.055 * linear ** (1 / 2.4) - 0.055;
  return Math.max(0, Math.min(255, Math.round(c * 255)));
}

/** An OKLab colour as 8-bit sRGB, clipped into the gamut. */
export function oklabToSrgb(L: number, a: number, b: number): [number, number, number] {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    toSrgb8(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    toSrgb8(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    toSrgb8(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ];
}

/** Every pixel of an 8-bit RGB image in OKLab, three floats each. */
export function toOklab(rgb: Uint8Array, pixels: number): Float32Array {
  const lab = new Float32Array(pixels * 3);
  for (let p = 0; p < pixels; p++) srgbToOklab(rgb[p * 3], rgb[p * 3 + 1], rgb[p * 3 + 2], lab, p * 3);
  return lab;
}

/** The distance between colours `i` and `j` of two packed OKLab arrays. */
export function distance(a: ArrayLike<number>, i: number, b: ArrayLike<number>, j: number): number {
  const dL = a[i * 3] - b[j * 3];
  const da = a[i * 3 + 1] - b[j * 3 + 1];
  const db = a[i * 3 + 2] - b[j * 3 + 2];
  return Math.sqrt(dL * dL + da * da + db * db);
}

export function hex(r: number, g: number, b: number): string {
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

export function parseHex(value: string): [number, number, number] {
  const n = Number.parseInt(value.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** WCAG relative luminance of a "#rrggbb" colour. */
export function luminance(value: string): number {
  const [r, g, b] = parseHex(value);
  return 0.2126 * TO_LINEAR[r] + 0.7152 * TO_LINEAR[g] + 0.0722 * TO_LINEAR[b];
}

/**
 * Black or white, whichever reads better on `value`: black above a luminance of 0.179, where both
 * give the same contrast ratio (√(1.05 · 0.05) − 0.05).
 */
export function inkOn(value: string): "#000000" | "#ffffff" {
  return luminance(value) > 0.179 ? "#000000" : "#ffffff";
}
