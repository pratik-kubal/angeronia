import { describe, expect, it } from "vitest";
import { distance, parseHex, srgbToOklab } from "./color";
import { generate, type Picture } from "./generate";
import { contains, regionPolygons } from "./geometry";
import type { Level } from "./levels";
import { encodePuzzle, roundTrip } from "./puzzle";

// The whole conversion on a small synthetic picture with everything a photo throws at it: soft
// shapes, a gradient, noise and 1-px lines. Every area must be findable and tappable (the level's
// floors), every number inside its area, the colours told apart, and the same pixels must always
// give the same puzzle.

const WIDTH = 200;
const HEIGHT = 140;
const MAGENTA: [number, number, number] = [230, 30, 200];

function picture(): Picture {
  const rgb = new Uint8Array(WIDTH * HEIGHT * 3);
  let seed = 12345;
  const noise = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return (seed % 21) - 10;
  };
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      // A sky-to-grass gradient, a sun, a dark block, all a little noisy, crossed by 1-px lines.
      let c: [number, number, number] = y < 70 ? [90 + y, 150 + y / 2, 230] : [60, 140 - (y - 70) / 2, 50];
      if ((x - 150) ** 2 + (y - 40) ** 2 < 22 ** 2) c = [250, 210, 60];
      if (x > 20 && x < 70 && y > 80 && y < 125) c = [40, 30, 35];
      if (x % 37 === 0 || y === 100) c = MAGENTA;
      const p = (y * WIDTH + x) * 3;
      rgb[p] = Math.max(0, Math.min(255, c[0] + noise()));
      rgb[p + 1] = Math.max(0, Math.min(255, c[1] + noise()));
      rgb[p + 2] = Math.max(0, Math.min(255, c[2] + noise()));
    }
  }
  return { rgb, width: WIDTH, height: HEIGHT };
}

const LEVEL: Level = { id: "medium", name: "Test", colours: 8, passes: 1, minArea: 40, minRadius: 2.25, maxAreas: 200, minDistance: 0.04, magnifiers: 3 };

describe("generate", () => {
  const { puzzle, stats } = generate(picture(), LEVEL, "test", 7707);

  it("covers the picture exactly once", () => {
    expect(puzzle.regions.reduce((sum, r) => sum + r.area, 0)).toBe(WIDTH * HEIGHT);
    expect(stats.areas).toBe(puzzle.regions.length);
  });

  it("keeps every area above the level's floors: big enough to find, wide enough to tap", () => {
    for (const region of puzzle.regions) {
      expect(region.area).toBeGreaterThanOrEqual(LEVEL.minArea);
      expect(region.labels[0].r).toBeGreaterThanOrEqual(LEVEL.minRadius);
    }
  });

  it("puts every number inside its own area", () => {
    for (const region of puzzle.regions) {
      const outline = regionPolygons(puzzle, region, 8);
      for (const label of region.labels) expect(contains(outline, label.x, label.y)).toBe(true);
    }
  });

  it("uses every colour, at most as many as asked, none two a player couldn't tell apart", () => {
    expect(puzzle.palette.length).toBeLessThanOrEqual(LEVEL.colours);
    expect(new Set(puzzle.regions.map((r) => r.colour)).size).toBe(puzzle.palette.length);
    const lab = new Float64Array(puzzle.palette.length * 3);
    puzzle.palette.forEach((hex, i) => srgbToOklab(...parseHex(hex), lab, i * 3));
    for (let i = 0; i < puzzle.palette.length; i++) {
      // 8-bit rounding can move a colour by a hair.
      for (let j = i + 1; j < puzzle.palette.length; j++) expect(distance(lab, i, lab, j)).toBeGreaterThan(LEVEL.minDistance - 0.005);
    }
  });

  it("drops 1-px lines: no colour is left for them", () => {
    const magenta = new Float64Array(3);
    srgbToOklab(...MAGENTA, magenta, 0);
    const lab = new Float64Array(3);
    for (const hex of puzzle.palette) {
      srgbToOklab(...parseHex(hex), lab, 0);
      expect(distance(lab, 0, magenta, 0)).toBeGreaterThan(0.1);
    }
  });

  it("gives the same puzzle for the same pixels", () => {
    expect(encodePuzzle(generate(picture(), LEVEL, "test", 7707).puzzle)).toBe(encodePuzzle(puzzle));
  });

  it("reads back from its file as itself", () => {
    const once = encodePuzzle(roundTrip(puzzle));
    expect(encodePuzzle(roundTrip(roundTrip(puzzle)))).toBe(once);
    const back = roundTrip(puzzle);
    expect(back.regions.map((r) => r.area)).toEqual(puzzle.regions.map((r) => r.area));
    expect(back.palette).toEqual(puzzle.palette);
    back.segments.forEach((s, i) => {
      expect(s.points.length).toBe(puzzle.segments[i].points.length);
      for (let j = 0; j < s.points.length; j++) expect(Math.abs(s.points[j] - puzzle.segments[i].points[j])).toBeLessThanOrEqual(1 / 16);
    });
  });
});
