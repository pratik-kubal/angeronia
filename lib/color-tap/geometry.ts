// Drawing borders. A segment's control polygon is drawn as a quadratic B-spline: it starts and ends
// on the segment's first and last points (junctions stay where three areas meet) and curves through
// the midpoints between, with each point in between as a control. Walked backwards it is the very
// same curve, so an area and its neighbour trace one line. The same path feeds a canvas (Path2D),
// an SVG string and the hit test, which flattens it.

import type { Puzzle, Region, Segment } from "./types";

/** What a path is drawn into: a Path2D or a CanvasRenderingContext2D, an SVG path-data writer, a flattener. */
export interface PathSink {
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  quadraticCurveTo(cx: number, cy: number, x: number, y: number): void;
  closePath(): void;
}

/** One segment, forwards or backwards; `move` starts a new subpath at its first point. */
export function traceHalf(sink: PathSink, seg: Segment, reverse: boolean, move: boolean) {
  const p = seg.points;
  const n = p.length / 2;
  const x = (i: number) => p[(reverse ? n - 1 - i : i) * 2];
  const y = (i: number) => p[(reverse ? n - 1 - i : i) * 2 + 1];
  if (seg.closed) {
    if (move) sink.moveTo((x(n - 1) + x(0)) / 2, (y(n - 1) + y(0)) / 2);
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      sink.quadraticCurveTo(x(i), y(i), (x(i) + x(j)) / 2, (y(i) + y(j)) / 2);
    }
    return;
  }
  if (move) sink.moveTo(x(0), y(0));
  if (n === 2) {
    sink.lineTo(x(1), y(1));
    return;
  }
  for (let i = 1; i < n - 2; i++) sink.quadraticCurveTo(x(i), y(i), (x(i) + x(i + 1)) / 2, (y(i) + y(i + 1)) / 2);
  sink.quadraticCurveTo(x(n - 2), y(n - 2), x(n - 1), y(n - 1));
}

/** An area's outline: every ring, outer and holes, each a closed subpath (fill it nonzero). */
export function traceRegion(sink: PathSink, puzzle: Puzzle, region: Region) {
  for (const ring of region.rings) {
    ring.forEach((h, i) => traceHalf(sink, puzzle.segments[h >> 1], (h & 1) === 1, i === 0));
    sink.closePath();
  }
}

/** SVG path data, scaled. */
export class SvgPath implements PathSink {
  d = "";
  constructor(private readonly scale: number) {}
  private n(v: number) {
    return Math.round(v * this.scale * 100) / 100;
  }
  moveTo(x: number, y: number) {
    this.d += `M${this.n(x)} ${this.n(y)}`;
  }
  lineTo(x: number, y: number) {
    this.d += `L${this.n(x)} ${this.n(y)}`;
  }
  quadraticCurveTo(cx: number, cy: number, x: number, y: number) {
    this.d += `Q${this.n(cx)} ${this.n(cy)} ${this.n(x)} ${this.n(y)}`;
  }
  closePath() {
    this.d += "Z";
  }
}

/** Flattens a path into polygons, each curve cut into `steps` straight pieces. */
export class Flattener implements PathSink {
  rings: number[][] = [];
  private current: number[] = [];
  private x = 0;
  private y = 0;
  constructor(private readonly steps: number) {}
  moveTo(x: number, y: number) {
    if (this.current.length > 0) this.rings.push(this.current);
    this.current = [x, y];
    this.x = x;
    this.y = y;
  }
  lineTo(x: number, y: number) {
    this.current.push(x, y);
    this.x = x;
    this.y = y;
  }
  quadraticCurveTo(cx: number, cy: number, x: number, y: number) {
    for (let s = 1; s <= this.steps; s++) {
      const t = s / this.steps;
      const u = 1 - t;
      this.current.push(u * u * this.x + 2 * u * t * cx + t * t * x, u * u * this.y + 2 * u * t * cy + t * t * y);
    }
    this.x = x;
    this.y = y;
  }
  closePath() {
    if (this.current.length > 0) this.rings.push(this.current);
    this.current = [];
  }
}

/** An area's outline as flat polygons. */
export function regionPolygons(puzzle: Puzzle, region: Region, steps: number): number[][] {
  const flat = new Flattener(steps);
  traceRegion(flat, puzzle, region);
  return flat.rings;
}

/** Whether (x, y) is inside the polygons, by the nonzero winding rule. */
export function contains(rings: number[][], x: number, y: number): boolean {
  let winding = 0;
  for (const ring of rings) {
    const n = ring.length / 2;
    for (let i = 0; i < n; i++) {
      const x0 = ring[i * 2];
      const y0 = ring[i * 2 + 1];
      const j = (i + 1) % n;
      const x1 = ring[j * 2];
      const y1 = ring[j * 2 + 1];
      if (y0 <= y) {
        if (y1 > y && (x1 - x0) * (y - y0) - (x - x0) * (y1 - y0) > 0) winding++;
      } else if (y1 <= y && (x1 - x0) * (y - y0) - (x - x0) * (y1 - y0) < 0) winding--;
    }
  }
  return winding !== 0;
}
