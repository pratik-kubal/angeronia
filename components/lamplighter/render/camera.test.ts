import { describe, expect, it } from "vitest";
import { DEG } from "@/lib/lamplighter/math";
import { ROUTES, compiled } from "@/lib/lamplighter/routes";
import { halfAt, poseAt } from "@/lib/lamplighter/track";
import { cameraAt, MAX_ROLL } from "./camera";
import { project } from "./project";
import { HOVER } from "./scene";

// Phones upright (about 9:19.5) and on their side.
const SCREENS = [
  { w: 393, h: 852 },
  { w: 852, h: 393 },
];

describe.each(ROUTES.map((def) => [def.id] as const))("%s", (id) => {
  const { track } = compiled(id);

  it("keeps Wick in the middle of the picture and below its centre, all the way along", () => {
    const pt = { x: 0, y: 0 };
    for (const { w, h } of SCREENS) {
      for (let s = 0; s < track.length - 5; s += 5) {
        const half = halfAt(track, s);
        for (const x of [-half + 0.3, 0, half - 0.3]) {
          const cam = cameraAt(track, { s, x, h: 0 }, { w, h, viewRoll: 0, reduced: false, dt: 0 }, null);
          const z = project(cam, poseAt(track, s, x, HOVER, [0, 0, 0]), pt, [0, 0, 0]);
          expect(z, `s ${s}`).toBeGreaterThan(3);
          expect(Math.abs(pt.x - w / 2), `s ${s}, x ${x}, ${w}×${h}`).toBeLessThan(w * 0.3);
          expect(pt.y, `s ${s}, ${w}×${h}`).toBeGreaterThan(h * 0.45);
          expect(pt.y, `s ${s}, ${w}×${h}`).toBeLessThan(h * 0.9);
        }
      }
    }
  });
});

describe("cameraAt", () => {
  const { track } = compiled("first-light");
  // Near the end of First Light's first bend, where the ribbon leans right.
  const banked = 135;
  const opts = { w: 393, h: 852, viewRoll: 0, reduced: false, dt: 0 };

  it("leans with the ribbon's bank, and not at all under reduced motion", () => {
    expect(track.bank[Math.round(banked / track.step)]).toBeGreaterThan(5 * DEG);
    expect(cameraAt(track, { s: banked, x: 0, h: 0 }, opts, null).roll).toBeGreaterThan(2 * DEG);
    expect(cameraAt(track, { s: banked, x: 0, h: 0 }, { ...opts, reduced: true }, null).roll).toBe(0);
  });

  it("adds the view's own roll, and never rolls past its limit", () => {
    const flat = cameraAt(track, { s: 10, x: 0, h: 0 }, { ...opts, viewRoll: 0.2 }, null);
    expect(flat.roll).toBeCloseTo(0.2, 6);
    expect(cameraAt(track, { s: banked, x: 0, h: 0 }, { ...opts, viewRoll: 2 }, null).roll).toBe(MAX_ROLL);
    expect(cameraAt(track, { s: banked, x: 0, h: 0 }, { ...opts, viewRoll: -2 }, null).roll).toBe(-MAX_ROLL);
  });

  it("sees Wick at the start, from straight behind the ribbon's first metre", () => {
    const cam = cameraAt(track, { s: 0, x: 0, h: 0 }, opts, null);
    expect(cam.eye[2]).toBeLessThan(-5);
  });

  it("eases toward where it should be rather than jumping", () => {
    const a = cameraAt(track, { s: 50, x: 0, h: 0 }, opts, null);
    const b = cameraAt(track, { s: 50, x: 2, h: 0 }, { ...opts, dt: 1 / 60 }, a);
    const goal = cameraAt(track, { s: 50, x: 2, h: 0 }, opts, null);
    expect(b.eye[0]).toBeGreaterThan(a.eye[0]);
    expect(b.eye[0]).toBeLessThan(goal.eye[0]);
  });
});
