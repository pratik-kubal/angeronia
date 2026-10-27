import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { mulberry32 } from "../random";
import { contains, regionPolygons } from "./geometry";
import { HitIndex } from "./hit";
import { PICTURES } from "./pictures";
import { decodePuzzle } from "./puzzle";
import type { Puzzle, Region } from "./types";

// The hit test against the committed puzzles of one picture, every level from Easy (about 160
// areas) to Master (about 2,000). Proven: every number, the main one and the extras, finds its own
// area under it; nothing is found outside the picture; inside it, the grid finds exactly what a
// scan of every area finds, and every point finds an area; near() takes the area under the finger
// when it may, whatever the radius (0, infinite or NaN included), otherwise reaches an allowed area
// up to its radius, from inside the picture or just off its edge, never one beyond it, and looks
// in the documented order; within() lists exactly the areas whose boxes a scan finds meeting the
// rectangle. On a small hand-built puzzle: where two outlines both hold a point, the smaller area
// wins, whatever their order in the file, and the index never changes the puzzle it was given.
// And 10,000 taps on Master take well under a second.

function load(src: string): Puzzle {
  return decodePuzzle(JSON.parse(fs.readFileSync(path.join("public", src), "utf8")));
}

/** The reference: every area, smallest first (then by index), box then outline. No grid. */
function scanner(puzzle: Puzzle) {
  const order = puzzle.regions.map((_, i) => i).sort((a, b) => puzzle.regions[a].area - puzzle.regions[b].area || a - b);
  const outlines = new Map<number, number[][]>();
  return (x: number, y: number): number => {
    if (!(x >= 0 && x < puzzle.width && y >= 0 && y < puzzle.height)) return -1;
    for (const i of order) {
      const [x0, y0, x1, y1] = puzzle.regions[i].box;
      if (x < x0 || x > x1 || y < y0 || y > y1) continue;
      let outline = outlines.get(i);
      if (!outline) {
        outline = regionPolygons(puzzle, puzzle.regions[i], 4);
        outlines.set(i, outline);
      }
      if (contains(outline, x, y)) return i;
    }
    return -1;
  };
}

/** near()'s points as its contract states them: the point, 6 at half the radius, 12 at the radius, each ring by angle from east. */
const RINGS: [number, number][] = [
  [0, 0],
  ...Array.from({ length: 6 }, (_, k): [number, number] => [0.5 * Math.cos((k * Math.PI) / 3), 0.5 * Math.sin((k * Math.PI) / 3)]),
  ...Array.from({ length: 12 }, (_, k): [number, number] => [Math.cos((k * Math.PI) / 6), Math.sin((k * Math.PI) / 6)]),
];

/** How far (x, y) is from an area's bounding box. */
function boxDistance(region: Region, x: number, y: number): number {
  const [x0, y0, x1, y1] = region.box;
  return Math.hypot(Math.max(x0 - x, 0, x - x1), Math.max(y0 - y, 0, y - y1));
}

/** A few areas spread over the list, so the per-area tests stay quick on Master. */
function someAreas(puzzle: Puzzle, count: number): number[] {
  const step = Math.max(1, Math.floor(puzzle.regions.length / count));
  return puzzle.regions.map((_, i) => i).filter((i) => i % step === 0);
}

/** A tap radius in work px: 12 CSS px at a moderate zoom. */
const RADIUS = 6;

const picture = PICTURES[0];

describe(`HitIndex on ${picture.title}`, () => {
  for (const entry of picture.levels) {
    describe(`${entry.level}, ${entry.areas} areas`, () => {
      const puzzle = load(entry.src);
      const index = new HitIndex(puzzle);
      const { width, height } = puzzle;

      it("finds each number's own area under it, for every number of every area", () => {
        const wrong: { area: number; label: number; found: number }[] = [];
        puzzle.regions.forEach((region, area) => {
          region.labels.forEach((label, i) => {
            const found = index.at(label.x, label.y);
            if (found !== area) wrong.push({ area, label: i, found });
          });
        });
        expect(wrong).toEqual([]);
      });

      it("finds nothing outside the picture, on its far edges, or at a point that isn't a number at all", () => {
        const outside: [number, number][] = [
          [-1, 10],
          [-0.001, height / 2],
          [width / 2, -0.001],
          [width, height / 2],
          [width + 5, height / 2],
          [width / 2, height],
          [width / 2, height + 0.5],
          [-100, -100],
          [1e9, 1e9],
          [-Infinity, 0],
          [Infinity, 0],
          [NaN, 10],
          [10, NaN],
        ];
        for (const [x, y] of outside) expect(index.at(x, y), `(${x}, ${y})`).toBe(-1);
      });

      it("finds exactly what a scan of every area finds, and an area at every point of the picture", () => {
        const scan = scanner(puzzle);
        const random = mulberry32(2101);
        const disagree: { x: number; y: number; grid: number; scan: number }[] = [];
        let missed = 0;
        for (let n = 0; n < 2000; n++) {
          const x = random() * width;
          const y = random() * height;
          const grid = index.at(x, y);
          const expected = scan(x, y);
          if (grid !== expected) disagree.push({ x, y, grid, scan: expected });
          if (grid < 0) missed++;
        }
        expect(disagree).toEqual([]);
        // The smoothed outlines tile the picture: borders are shared curves, so no point falls between.
        expect(missed).toBe(0);
      });

      it("near() takes the area under the point when it is accepted, even with others in reach", () => {
        const random = mulberry32(17);
        for (let n = 0; n < 300; n++) {
          const x = random() * width;
          const y = random() * height;
          expect(index.near(x, y, RADIUS, () => true)).toBe(index.at(x, y));
        }
      });

      it("near() still takes the area under the point when the radius is 0, infinite or not a number", () => {
        const random = mulberry32(23);
        for (let n = 0; n < 100; n++) {
          const x = random() * width;
          const y = random() * height;
          const under = index.at(x, y);
          for (const radius of [0, Infinity, NaN]) expect(index.near(x, y, radius, () => true), `radius ${radius}`).toBe(under);
          // And with nothing accepted, a radius of 0 has nowhere else to look.
          expect(index.near(x, y, 0, (a) => a !== under)).toBe(-1);
        }
      });

      it("near() reaches into the picture from a finger just off its edge, but not from farther off than the radius", () => {
        const random = mulberry32(31);
        for (let n = 0; n < 50; n++) {
          const x = random() * width;
          const y = random() * height;
          // One px off each edge: the inner ring already lands RADIUS / 2 - 1 px inside.
          for (const [px, py] of [
            [-1, y],
            [width + 1, y],
            [x, -1],
            [x, height + 1],
          ]) {
            const found = index.near(px, py, RADIUS, () => true);
            expect(found, `(${px}, ${py})`).toBeGreaterThanOrEqual(0);
            expect(boxDistance(puzzle.regions[found], px, py)).toBeLessThanOrEqual(RADIUS + 1e-9);
          }
          // Past the radius off the left or top edge, every point near() tries is off the picture.
          expect(index.near(-RADIUS - 1, y, RADIUS, () => true)).toBe(-1);
          expect(index.near(x, -RADIUS - 1, RADIUS, () => true)).toBe(-1);
        }
      });

      it("near() reaches an accepted area from any of its 18 points on either ring", () => {
        const missed: { area: number; point: number }[] = [];
        for (const area of someAreas(puzzle, 120)) {
          const { x, y } = puzzle.regions[area].labels[0];
          // Stand so that one of near()'s points lands right on the area's number.
          RINGS.slice(1).forEach(([dx, dy], point) => {
            const found = index.near(x - dx * RADIUS, y - dy * RADIUS, RADIUS, (a) => a === area);
            if (found !== area) missed.push({ area, point });
          });
        }
        expect(missed).toEqual([]);
      });

      it("near() refuses an area that is farther away than the radius", () => {
        let tried = 0;
        for (const area of someAreas(puzzle, 120)) {
          const region = puzzle.regions[area];
          const [x0, y0, x1, y1] = region.box;
          const { x, y } = region.labels[0];
          // Just past the radius beyond its box, on whichever side the picture goes on.
          const beyond = RADIUS + 0.5;
          const stand = (
            [
              [x1 + beyond, y],
              [x0 - beyond, y],
              [x, y1 + beyond],
              [x, y0 - beyond],
            ] as [number, number][]
          ).find(([px, py]) => px >= 0 && px < width && py >= 0 && py < height);
          if (!stand) continue;
          tried++;
          expect(index.near(stand[0], stand[1], RADIUS, (a) => a === area), `area ${area}`).toBe(-1);
          // And from the same spot it is found once the radius reaches its number, which lies due
          // east, west, north or south: right where one of the outer ring's points lands.
          const reach = Math.hypot(stand[0] - x, stand[1] - y);
          expect(reach).toBeGreaterThan(RADIUS);
          expect(index.near(stand[0], stand[1], reach, (a) => a === area), `area ${area}, radius ${reach}`).toBe(area);
        }
        expect(tried).toBeGreaterThan(0);
      });

      it("near() looks at the point, then the inner ring, then the outer, each by angle, and stops at the first it may take", () => {
        const random = mulberry32(99);
        for (let n = 0; n < 300; n++) {
          const x = random() * width;
          const y = random() * height;
          // Any rule will do; this one takes about a third of the areas.
          const salt = n % 3;
          const accept = (a: number) => a % 3 === salt;
          let expected = -1;
          for (const [dx, dy] of RINGS) {
            const a = index.at(x + dx * RADIUS, y + dy * RADIUS);
            if (a >= 0 && accept(a)) {
              expected = a;
              break;
            }
          }
          const found = index.near(x, y, RADIUS, accept);
          expect(found).toBe(expected);
          if (found >= 0) expect(boxDistance(puzzle.regions[found], x, y)).toBeLessThanOrEqual(RADIUS + 1e-9);
        }
      });

      it("within() lists exactly the areas whose boxes a scan finds meeting the rectangle, in order, once each", () => {
        const scan = (x0: number, y0: number, x1: number, y1: number) =>
          puzzle.regions.flatMap((region, i) => {
            const [bx0, by0, bx1, by1] = region.box;
            return bx0 <= x1 && bx1 >= x0 && by0 <= y1 && by1 >= y0 ? [i] : [];
          });
        const random = mulberry32(5);
        for (let n = 0; n < 300; n++) {
          // Some reach past the picture's edges, some are a single point.
          const x0 = random() * (width + 80) - 40;
          const y0 = random() * (height + 80) - 40;
          const x1 = x0 + (n % 10 === 0 ? 0 : random() * 240);
          const y1 = y0 + (n % 10 === 0 ? 0 : random() * 240);
          expect(index.within(x0, y0, x1, y1)).toEqual(scan(x0, y0, x1, y1));
        }
      });

      it("within() lists every area for the whole picture, none for a rectangle off it, and takes its corners either way round", () => {
        expect(index.within(0, 0, width, height)).toEqual(puzzle.regions.map((_, i) => i));
        expect(index.within(-50, -50, -1, -1)).toEqual([]);
        expect(index.within(width + 1, 0, width + 60, height)).toEqual([]);
        expect(index.within(300, 200, 100, 50)).toEqual(index.within(100, 50, 300, 200));
      });
    });
  }
});

describe("HitIndex on a hand-built puzzle", () => {
  // Two closed outlines on a 40 × 40 picture (2 × 2 cells of the grid): a big rounded square, and
  // a small one inside it that the big one has no hole for, so both hold the small one's middle.
  // The small one sits on the corner where all four cells meet.
  const big: Region = { colour: 0, area: 1000, box: [2, 2, 38, 38], labels: [{ x: 20, y: 20, r: 10 }], rings: [[0]] };
  const small: Region = { colour: 1, area: 40, box: [28, 28, 36, 36], labels: [{ x: 32, y: 32, r: 2 }], rings: [[2]] };
  const segments = [
    { left: 0, right: -1, closed: true, points: new Float32Array([2, 2, 38, 2, 38, 38, 2, 38]) },
    { left: 1, right: 0, closed: true, points: new Float32Array([28, 28, 36, 28, 36, 36, 28, 36]) },
  ];
  const puzzle = (regions: Region[]): Puzzle => ({ id: "test", picture: "test", level: "easy", width: 40, height: 40, palette: ["#000000", "#ffffff"], regions, segments });

  it("gives a point both outlines hold to the smaller area, whichever comes first in the file", () => {
    const bigFirst = new HitIndex(puzzle([big, small]));
    const smallFirst = new HitIndex(puzzle([small, big]));
    for (const [x, y] of [
      [32, 32],
      [30, 30],
      [34, 30],
      [30, 34],
      [34, 34],
    ]) {
      expect(bigFirst.at(x, y), `(${x}, ${y})`).toBe(1);
      expect(smallFirst.at(x, y), `(${x}, ${y})`).toBe(0);
    }
    expect(bigFirst.at(20, 20)).toBe(0);
    expect(smallFirst.at(20, 20)).toBe(1);
  });

  it("finds nothing in the picture's corner, outside both outlines", () => {
    const index = new HitIndex(puzzle([big, small]));
    expect(index.at(1, 1)).toBe(-1);
    expect(index.at(39, 1)).toBe(-1);
  });

  it("near() steps past the area under the point to an accepted one", () => {
    const index = new HitIndex(puzzle([big, small]));
    // From inside the big area, 5 px from the small one's middle: only the small one is wanted.
    expect(index.near(27, 32, 6, (a) => a === 1)).toBe(1);
    expect(index.near(20, 20, 6, (a) => a === 1)).toBe(-1);
  });

  it("leaves the puzzle it is given as it found it, and hands out a fresh list from within() each time", () => {
    const given = puzzle([big, small]);
    const before = structuredClone(given);
    const index = new HitIndex(given);
    index.at(32, 32);
    index.near(27, 32, 6, (a) => a === 1);
    const first = index.within(0, 0, 40, 40);
    first.push(99);
    expect(index.within(0, 0, 40, 40)).toEqual([0, 1]);
    expect(given).toEqual(before);
  });

  it("within() lists both areas for a rectangle in either cell they share, and one where only the big one reaches", () => {
    const index = new HitIndex(puzzle([big, small]));
    expect(index.within(33, 33, 34, 34)).toEqual([0, 1]);
    expect(index.within(5, 5, 10, 10)).toEqual([0]);
    expect(index.within(0, 0, 1, 1)).toEqual([]);
  });
});

describe("HitIndex speed", () => {
  const master = picture.levels.find((l) => l.level === "master")!;

  it(`answers 10,000 taps on ${picture.title} at Master well inside a second, outlines flattened on the way`, () => {
    const puzzle = load(master.src);
    const index = new HitIndex(puzzle);
    const random = mulberry32(42);
    const points = Array.from({ length: 20000 }, () => random());
    const start = performance.now();
    let found = 0;
    for (let n = 0; n < 10000; n++) if (index.at(points[2 * n] * puzzle.width, points[2 * n + 1] * puzzle.height) >= 0) found++;
    const ms = performance.now() - start;
    expect(found).toBe(10000);
    expect(ms).toBeLessThan(250);
  });
});
