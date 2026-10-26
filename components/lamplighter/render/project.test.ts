import { describe, expect, it } from "vitest";
import { clipToScreen, NEAR, project, type Camera } from "./project";

/** Looking along +z from the origin, 400 × 800, focal length 400. */
const cam: Camera = { eye: [0, 0, 0], fwd: [0, 0, 1], right: [1, 0, 0], up: [0, 1, 0], f: 400, w: 400, h: 800, roll: 0 };
const pt = { x: 0, y: 0 };

describe("project", () => {
  it("puts a point straight ahead at the centre, right of it to the right and above it higher", () => {
    expect(project(cam, [0, 0, 10], pt, [0, 0, 0])).toBe(10);
    expect(pt).toEqual({ x: 200, y: 400 });
    project(cam, [1, 2, 10], pt, [0, 0, 0]);
    expect(pt).toEqual({ x: 240, y: 320 });
  });

  it("refuses a point behind the near plane", () => {
    expect(project(cam, [0, 0, -5], pt, [0, 0, 0])).toBe(0);
    expect(project(cam, [0, 0, NEAR / 2], pt, [0, 0, 0])).toBe(0);
  });
});

describe("clipToScreen", () => {
  const out = new Float64Array(16);

  it("keeps a quad wholly in front", () => {
    const quad = Float64Array.from([-1, -1, 5, 1, -1, 5, 1, -1, 10, -1, -1, 10]);
    expect(clipToScreen(cam, quad, 4, out)).toBe(4);
  });

  it("drops a quad wholly behind", () => {
    const quad = Float64Array.from([-1, -1, -5, 1, -1, -5, 1, -1, -1, -1, -1, -1]);
    expect(clipToScreen(cam, quad, 4, out)).toBe(0);
  });

  it("cuts a quad that runs past the camera at the near plane, with every corner on a finite screen spot", () => {
    const quad = Float64Array.from([-1, -1, -3, 1, -1, -3, 1, -1, 10, -1, -1, 10]);
    const n = clipToScreen(cam, quad, 4, out);
    expect(n).toBe(4);
    for (let i = 0; i < n * 2; i++) expect(Number.isFinite(out[i])).toBe(true);
    // The cut edge sits at the near plane: lowest on screen, but not flipped above the horizon.
    for (let i = 0; i < n; i++) expect(out[i * 2 + 1]).toBeGreaterThan(cam.h / 2);
  });
});
