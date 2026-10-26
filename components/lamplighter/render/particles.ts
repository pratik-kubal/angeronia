// Little lights for the look of it: Wick's trail, a spark's burst, a lamp's flare, a hit's puff.
// World-space points with a life, in fixed-size typed arrays (no garbage mid-race), moved by the
// frame's own time and their own seeded randomness, so they never touch the simulation.

import { mulberry32 } from "@/lib/random";

export const MAX_PARTICLES = 160;

/** 0 warm (a firefly's light), 1 cool (moonlight, rain, a hit's puff). */
export type Tint = 0 | 1;

export type Particles = {
  x: Float64Array;
  y: Float64Array;
  z: Float64Array;
  vx: Float64Array;
  vy: Float64Array;
  vz: Float64Array;
  life: Float64Array;
  span: Float64Array;
  size: Float64Array;
  tint: Uint8Array;
  /** How many may live at once (the quality tier's cap). */
  cap: number;
  next: number;
  rng: () => number;
};

export function createParticles(seed: number): Particles {
  const f = () => new Float64Array(MAX_PARTICLES);
  return { x: f(), y: f(), z: f(), vx: f(), vy: f(), vz: f(), life: f(), span: f(), size: f(), tint: new Uint8Array(MAX_PARTICLES), cap: MAX_PARTICLES, next: 0, rng: mulberry32(seed) };
}

/** Emits `n` points at `at`, flung at up to `speed` m/s, living about `life` seconds. */
export function emit(p: Particles, at: readonly number[], n: number, speed: number, life: number, size: number, tint: Tint, lift = 0) {
  for (let k = 0; k < n; k++) {
    const i = p.next;
    p.next = (p.next + 1) % p.cap;
    const r = p.rng;
    p.x[i] = at[0];
    p.y[i] = at[1];
    p.z[i] = at[2];
    p.vx[i] = (r() * 2 - 1) * speed;
    p.vy[i] = (r() * 2 - 1) * speed + lift;
    p.vz[i] = (r() * 2 - 1) * speed;
    p.span[i] = p.life[i] = life * (0.6 + r() * 0.8);
    p.size[i] = size * (0.6 + r() * 0.8);
    p.tint[i] = tint;
  }
}

export function update(p: Particles, dt: number) {
  const drag = Math.exp(-2.5 * dt);
  for (let i = 0; i < p.cap; i++) {
    if (p.life[i] <= 0) continue;
    p.life[i] -= dt;
    p.vx[i] *= drag;
    p.vy[i] *= drag;
    p.vz[i] *= drag;
    p.x[i] += p.vx[i] * dt;
    p.y[i] += p.vy[i] * dt;
    p.z[i] += p.vz[i] * dt;
  }
}

/** Changes the cap; points past it simply go out. */
export function setCap(p: Particles, cap: number) {
  for (let i = cap; i < p.cap; i++) p.life[i] = 0;
  p.cap = Math.max(1, Math.min(MAX_PARTICLES, cap));
  p.next %= p.cap;
}

export function clear(p: Particles) {
  p.life.fill(0);
}
