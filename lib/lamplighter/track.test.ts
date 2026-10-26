import { describe, expect, it } from "vitest";
import { dot, type V3 } from "./math";
import { ROUTES } from "./routes";
import { compileTrack, halfAt, poseAt, solidAt, TRACK_STEP, type Track } from "./track";

const at = (a: Float64Array, i: number): V3 => [a[i * 3], a[i * 3 + 1], a[i * 3 + 2]];
const len = (v: V3) => Math.hypot(v[0], v[1], v[2]);

describe.each(ROUTES.map((def) => [def.id, def] as const))("%s", (_, def) => {
  const track = compileTrack(def);

  it("is as long as its segments", () => {
    const total = def.segs.reduce((sum, seg) => sum + seg.len, 0);
    expect(Math.abs(track.length - total)).toBeLessThanOrEqual(TRACK_STEP / 2);
    expect(track.n).toBe(track.length / TRACK_STEP + 1);
  });

  it("samples the centre line every half metre", () => {
    for (let i = 1; i < track.n; i++) {
      const a = at(track.p, i - 1);
      const b = at(track.p, i);
      expect(Math.abs(len([b[0] - a[0], b[1] - a[1], b[2] - a[2]]) - TRACK_STEP)).toBeLessThan(1e-3);
    }
  });

  it("turns gently: no kink between samples", () => {
    for (let i = 1; i < track.n; i++) {
      // Under 3° per half metre: a radius of about 10 m at the tightest.
      expect(dot(at(track.t, i - 1), at(track.t, i))).toBeGreaterThan(Math.cos((3 * Math.PI) / 180));
    }
  });

  it("keeps an orthonormal frame that stays the right way up", () => {
    for (let i = 0; i < track.n; i++) {
      const t = at(track.t, i);
      const r = at(track.r, i);
      const u = at(track.u, i);
      for (const v of [t, r, u]) expect(Math.abs(len(v) - 1)).toBeLessThan(1e-5);
      expect(Math.abs(dot(t, r))).toBeLessThan(1e-5);
      expect(Math.abs(dot(t, u))).toBeLessThan(1e-5);
      expect(Math.abs(dot(r, u))).toBeLessThan(1e-5);
      expect(u[1]).toBeGreaterThan(0);
    }
  });

  it("keeps the ribbon between 1.5 and 5 metres from its centre to an edge", () => {
    for (let i = 0; i < track.n; i++) {
      expect(track.half[i]).toBeGreaterThanOrEqual(1.5);
      expect(track.half[i]).toBeLessThanOrEqual(5);
    }
  });

  it("never runs into itself", () => {
    // Samples far apart along the ribbon stay a ribbon's width and a metre apart in space.
    const gap = Math.round(20 / TRACK_STEP);
    for (let i = 0; i < track.n; i += 2) {
      const a = at(track.p, i);
      for (let j = i + gap; j < track.n; j += 2) {
        const b = at(track.p, j);
        const d = len([b[0] - a[0], b[1] - a[1], b[2] - a[2]]);
        expect(d).toBeGreaterThan(track.half[i] + track.half[j] + 1);
      }
    }
  });

  it("compiles to the same numbers every time", () => {
    const again = compileTrack(def);
    for (const key of ["p", "t", "r", "u", "half", "bank", "solid"] as const) {
      expect(Array.from(again[key])).toEqual(Array.from(track[key]));
    }
  });

  it("has its gaps exactly where they are authored", () => {
    let at = 0;
    for (const seg of def.segs) {
      if (seg.gap) {
        expect(solidAt(track, at + 0.5)).toBe(false);
        expect(solidAt(track, at + seg.len - 0.5)).toBe(false);
        expect(solidAt(track, at - 0.5)).toBe(true);
        expect(solidAt(track, at + seg.len + 0.5)).toBe(true);
      }
      at += seg.len;
    }
  });
});

describe("compileTrack", () => {
  const flat: Track = compileTrack({ start: { half: 3 }, segs: [{ len: 100 }] });

  it("starts at the origin heading along +z, with +x on the right", () => {
    expect(at(flat.p, 0)).toEqual([0, 0, 0]);
    expect(at(flat.t, 0)).toEqual([0, 0, 1]);
    expect(at(flat.r, 0)).toEqual([1, 0, 0]);
    expect(at(flat.u, 0)).toEqual([0, 1, 0]);
    expect(at(flat.p, flat.n - 1)[2]).toBeCloseTo(100, 6);
  });

  it("turns right for a positive yaw, and leans right for a positive bank", () => {
    const right = compileTrack({ start: { half: 3 }, segs: [{ len: 60, yaw: 90, bank: 20 }, { len: 20 }] });
    const end = at(right.t, right.n - 1);
    expect(end[0]).toBeCloseTo(1, 5);
    // Mid-turn the right edge dips: the right vector points a little down.
    expect(at(right.r, Math.round(right.n * 0.4))[1]).toBeLessThan(0);
  });

  it("climbs a spiral without twisting the ribbon over", () => {
    const spiral = compileTrack({
      start: { half: 2.6 },
      segs: [{ len: 20, pitch: 12 }, { len: 2 * Math.PI * 14 * 1.5, yaw: 540, ease: "linear" }, { len: 20, pitch: 0 }],
    });
    for (let i = 0; i < spiral.n; i++) expect(at(spiral.u, i)[1]).toBeGreaterThan(0.95);
    expect(at(spiral.p, spiral.n - 1)[1]).toBeGreaterThan(20);
  });

  it("puts a point to the right of the ribbon and above it", () => {
    const p = poseAt(flat, 50, 2, 1, [0, 0, 0]);
    expect(p[0]).toBeCloseTo(2, 6);
    expect(p[1]).toBeCloseTo(1, 6);
    expect(p[2]).toBeCloseTo(50, 6);
    expect(halfAt(flat, 50)).toBe(3);
  });
});
