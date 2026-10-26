// Small numeric helpers shared by the track, the simulation and the renderer. Everything the
// simulation touches stays deterministic across JavaScript engines: no Math.sin or Math.cos in a
// tick (a table instead), and tables rounded to a millionth so a last-bit difference between
// engines never reaches the game.

/** Rounds to a millionth: the precision every table is stored at. */
export const q = (v: number) => Math.round(v * 1e6) / 1e6;

export const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** 0 → 0, 1 → 1, with zero slope at both ends. */
export const smoothstep = (t: number) => t * t * (3 - 2 * t);

export const DEG = Math.PI / 180;

/** One full turn of sine in this many steps. */
const SIN_STEPS = 1024;
const SIN_TABLE = (() => {
  const t = new Float64Array(SIN_STEPS + 1);
  for (let i = 0; i <= SIN_STEPS; i++) t[i] = q(Math.sin((i / SIN_STEPS) * 2 * Math.PI));
  return t;
})();

/** Sine of `turns` full turns, from the table, linearly interpolated: deterministic everywhere. */
export function tsin(turns: number): number {
  const x = (turns - Math.floor(turns)) * SIN_STEPS;
  const i = Math.floor(x);
  return SIN_TABLE[i] + (SIN_TABLE[i + 1] - SIN_TABLE[i]) * (x - i);
}

export type V3 = [number, number, number];

export const v3 = (x = 0, y = 0, z = 0): V3 => [x, y, z];
export const dot = (a: Readonly<V3>, b: Readonly<V3>) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export function cross(a: Readonly<V3>, b: Readonly<V3>, out: V3 = v3()): V3 {
  const x = a[1] * b[2] - a[2] * b[1];
  const y = a[2] * b[0] - a[0] * b[2];
  const z = a[0] * b[1] - a[1] * b[0];
  out[0] = x;
  out[1] = y;
  out[2] = z;
  return out;
}
export function normalize(a: V3): V3 {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  a[0] /= l;
  a[1] /= l;
  a[2] /= l;
  return a;
}
