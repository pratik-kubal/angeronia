// Finding the area under a finger. A Master picture has about 2,000 areas, and a tap must be
// answered at once, so the areas are filed in a grid of 32-work-px cells by their bounding boxes:
// a point is only ever tested against the few areas whose boxes reach its cell, and an outline is
// flattened the first time a point lands in its box, then kept. The answer is the area whose
// smoothed outline holds the point, the very outline the canvas draws (geometry.ts), so a tap
// paints the area the player sees under it, not the pixel the photo had there.

import { contains, regionPolygons } from "./geometry";
import type { Puzzle } from "./types";

/** The grid's cell, in work px. */
const CELL = 32;
/** Straight pieces per curve when an outline is flattened for the test: a hair inside the drawn line. */
const STEPS = 4;

/**
 * Where near() looks after the point itself, as unit offsets from it: 6 points on a ring at half
 * the radius, then 12 on a ring at the radius, each ring from east (+x) round by increasing angle
 * (clockwise on screen, y down). Nearest first, so a closer area beats a farther one.
 */
const RINGS: readonly (readonly [number, number])[] = [...ring(6, 0.5), ...ring(12, 1)];

function ring(count: number, distance: number): [number, number][] {
  return Array.from({ length: count }, (_, k) => {
    const angle = (2 * Math.PI * k) / count;
    return [distance * Math.cos(angle), distance * Math.sin(angle)];
  });
}

export class HitIndex {
  private readonly puzzle: Puzzle;
  private readonly columns: number;
  private readonly rows: number;
  /** Cell c's areas are `items[starts[c]]` up to `items[starts[c + 1]]`, smallest area first. */
  private readonly starts: Int32Array;
  private readonly items: Int32Array;
  /** Each area's flattened outline, once a point has needed it. */
  private readonly outlines: (number[][] | undefined)[];

  constructor(puzzle: Puzzle) {
    this.puzzle = puzzle;
    this.columns = Math.max(1, Math.ceil(puzzle.width / CELL));
    this.rows = Math.max(1, Math.ceil(puzzle.height / CELL));
    const count = puzzle.regions.length;
    this.outlines = new Array(count);

    // Smallest area first (then by index, so the order never depends on the sort), so that where
    // two smoothed outlines both hold a point the small island wins over the area around it: it
    // is the one a player aiming that precisely meant.
    const order = puzzle.regions.map((_, i) => i).sort((a, b) => puzzle.regions[a].area - puzzle.regions[b].area || a - b);

    // Two passes, counting then filling, so each cell's list is one slice of one typed array.
    const starts = new Int32Array(this.columns * this.rows + 1);
    for (const i of order) this.eachCell(i, (cell) => starts[cell + 1]++);
    for (let c = 0; c < this.columns * this.rows; c++) starts[c + 1] += starts[c];
    const items = new Int32Array(starts[this.columns * this.rows]);
    const fill = starts.slice(0, this.columns * this.rows);
    for (const i of order) this.eachCell(i, (cell) => (items[fill[cell]++] = i));
    this.starts = starts;
    this.items = items;
  }

  /** The area at work point (x, y): its smoothed outline (geometry.ts regionPolygons, nonzero) contains the point; -1 outside the picture or if no outline does (a point exactly on a border). */
  at(x: number, y: number): number {
    // Written so that NaN is outside too.
    if (!(x >= 0 && x < this.puzzle.width && y >= 0 && y < this.puzzle.height)) return -1;
    const cell = this.cellOf(x, y);
    const regions = this.puzzle.regions;
    for (let k = this.starts[cell]; k < this.starts[cell + 1]; k++) {
      const i = this.items[k];
      const [x0, y0, x1, y1] = regions[i].box;
      if (x < x0 || x > x1 || y < y0 || y > y1) continue;
      if (contains(this.outline(i), x, y)) return i;
    }
    return -1;
  }

  /** Of the areas `accept` takes, the one at (x, y) or nearest it within `radius` work px: tests the point itself, then 6 points on a ring at radius/2 and 12 on a ring at radius (nearest ring first, then by angle), returns the first accepted hit; -1 if none. */
  near(x: number, y: number, radius: number, accept: (area: number) => boolean): number {
    // The point itself is asked on its own, not as offset 0 × radius: 0 × Infinity is NaN, and a
    // radius worked out from a scale of 0 would otherwise lose even the area under the finger.
    const under = this.at(x, y);
    if (under >= 0 && accept(under)) return under;
    // `accept` may be asked about one area more than once, when several points land in it.
    for (const [dx, dy] of RINGS) {
      const area = this.at(x + dx * radius, y + dy * radius);
      if (area >= 0 && accept(area)) return area;
    }
    return -1;
  }

  private outline(i: number): number[][] {
    let rings = this.outlines[i];
    if (!rings) {
      rings = regionPolygons(this.puzzle, this.puzzle.regions[i], STEPS);
      this.outlines[i] = rings;
    }
    return rings;
  }

  /**
   * Every cell an area's box reaches. The box is taken as closed, x0 to x1 and y0 to y1: its
   * outline runs along the pixel edges at x1 and y1, so a point exactly there must still find it.
   */
  private eachCell(i: number, visit: (cell: number) => void) {
    const [x0, y0, x1, y1] = this.puzzle.regions[i].box;
    for (let row = this.row(y0); row <= this.row(y1); row++) {
      for (let column = this.column(x0); column <= this.column(x1); column++) visit(row * this.columns + column);
    }
  }

  private cellOf(x: number, y: number): number {
    return this.row(y) * this.columns + this.column(x);
  }

  /** The column of x, clamped to the grid: a box reaching the picture's far edge keeps to its last cell. */
  private column(x: number): number {
    return Math.min(this.columns - 1, Math.max(0, Math.floor(x / CELL)));
  }

  private row(y: number): number {
    return Math.min(this.rows - 1, Math.max(0, Math.floor(y / CELL)));
  }
}
