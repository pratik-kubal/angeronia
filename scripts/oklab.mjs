// OKLab / OKLCh colour maths, shared by scripts/build-theme.mjs and
// scripts/retint-favicon.mjs.
//
// Björn Ottosson, "A perceptual color space for image processing" (2020),
// https://bottosson.github.io/posts/oklab/ — the sRGB transfer function and
// the LMS→OKLab matrices are taken verbatim from that reference.
//
// Everything here is pure: no I/O, no dependencies.

/** sRGB 8-bit channel (0..255) → linear-light (0..1). */
export function srgbToLinear(c) {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

/** Linear-light (0..1) → sRGB 8-bit channel (0..255), rounded and clamped. */
export function linearToSrgb(l) {
  const s = l <= 0.0031308 ? l * 12.92 : 1.055 * l ** (1 / 2.4) - 0.055;
  return Math.min(255, Math.max(0, Math.round(s * 255)));
}

/** `#rrggbb` | `#rgb` | `rgb(r,g,b)` → `[r, g, b]` in 0..255. */
export function parseColor(input) {
  const value = String(input).trim();
  const rgbFn = value.match(/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i);
  if (rgbFn) return [1, 2, 3].map((i) => Math.round(Number(rgbFn[i])));
  let hex = value.replace(/^#/, "");
  if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
  if (!/^[0-9a-f]{6}$/i.test(hex)) throw new Error(`Not a colour: ${input}`);
  return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
}

/** `[r, g, b]` in 0..255 → lower-case `#rrggbb`. */
export function toHex([r, g, b]) {
  return "#" + [r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("");
}

/** sRGB `[r, g, b]` (0..255) → OKLab `[L, a, b]`. */
export function rgbToOklab(rgb) {
  const [r, g, b] = rgb.map(srgbToLinear);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

/** OKLab `[L, a, b]` → sRGB `[r, g, b]` (0..255), gamut-clipped per channel. */
export function oklabToRgb([L, A, B]) {
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ].map(linearToSrgb);
}

/** Linear interpolation between two colours in OKLab. `t` 0 → a, 1 → b. */
export function mixOklab(a, b, t) {
  const A = rgbToOklab(parseColor(a));
  const Bl = rgbToOklab(parseColor(b));
  return toHex(oklabToRgb(A.map((v, i) => v + (Bl[i] - v) * t)));
}

/** WCAG 2.x relative luminance of an sRGB colour. */
export function relativeLuminance(color) {
  const [r, g, b] = parseColor(color).map(srgbToLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2.x contrast ratio between two sRGB colours (1 … 21). */
export function contrastRatio(fg, bg) {
  const a = relativeLuminance(fg);
  const b = relativeLuminance(bg);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
