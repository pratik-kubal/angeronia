import { describe, expect, it } from "vitest";
import { WIN_FX, createSim, type FxKind, type SimParams, type Sprite } from ".";

const PARAMS: SimParams[] = [
  // A phone on its side (rails: foundations two by two on the right) and a desktop (classic: in the top row).
  { width: 734, height: 321, cardW: 62, cardH: 90, foundations: [{ x: 600, y: 55 }, { x: 668, y: 55 }, { x: 600, y: 151 }, { x: 668, y: 151 }], seed: 1 },
  { width: 1440, height: 790, cardW: 110, cardH: 160, foundations: [0, 1, 2, 3].map((i) => ({ x: 700 + i * 130, y: 90 })), seed: 2 },
];
/** Each animation's longest run, in seconds. */
const CAP: Record<FxKind, number> = { cascade: 25, fountain: 10, spiral: 10, waterfall: 10 };

function run(kind: FxKind, p: SimParams) {
  const sim = createSim(kind, p);
  const frames: Sprite[][] = [];
  for (let k = 0; k < CAP[kind] * 60 + 1; k++) {
    const sprites = sim.step();
    if (!sprites) return { sim, frames, done: true };
    frames.push(sprites);
  }
  return { sim, frames, done: false };
}

describe.each(WIN_FX)("%s", (kind) => {
  it.each(PARAMS)("ends within its time and shows every card ($width × $height)", (p) => {
    const { frames, done } = run(kind, p);
    expect(done).toBe(true);
    expect(frames.length / 60).toBeGreaterThan(2);
    const seen = new Set(frames.flatMap((f) => f.map((s) => s.card)));
    expect(seen.size).toBe(52);
    for (const f of frames) for (const s of f) expect([s.x, s.y, s.rot].every(Number.isFinite)).toBe(true);
  });

  it("starts every card on its foundation", () => {
    const p = PARAMS[1];
    const first = createSim(kind, p).step()!;
    for (const s of first) {
      const home = p.foundations[Math.floor(s.card / 13)];
      expect(Math.hypot(s.x - home.x, s.y - home.y)).toBeLessThan(p.height * 0.1);
    }
  });

  it("plays the same for the same seed", () => {
    const a = run(kind, PARAMS[0]).frames.slice(0, 120);
    const b = run(kind, PARAMS[0]).frames.slice(0, 120);
    expect(b).toEqual(a);
  });
});

it("keeps the cascade's trails (it never clears) and clears the others", () => {
  expect(WIN_FX.map((kind) => createSim(kind, PARAMS[0]).clears)).toEqual([false, true, true, true]);
});

it("bounces the cascade's cards along the bottom, never through it", () => {
  const p = PARAMS[0];
  const { frames } = run("cascade", p);
  for (const f of frames) for (const s of f) expect(s.y).toBeLessThanOrEqual(p.height - p.cardH / 2 + 0.01);
});
