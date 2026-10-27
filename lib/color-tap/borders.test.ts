import { describe, expect, it } from "vitest";
import { traceBorders } from "./borders";
import { contains, regionPolygons } from "./geometry";
import { components } from "./regions";
import type { Puzzle } from "./types";

// The shared borders on small hand-drawn maps, one letter per pixel: every area's rings close, use
// each of its half-segments exactly once, and enclose exactly its pixels (outer ring negative, holes
// positive, y down); each segment really has two different sides; and the smoothed outline keeps
// each area's deepest pixel inside it.

function trace(rows: string[]) {
  const height = rows.length;
  const width = rows[0].length;
  const Q = new Uint8Array(width * height);
  rows.forEach((row, y) => [...row].forEach((ch, x) => (Q[y * width + x] = ch.charCodeAt(0) - 65)));
  const c = components(Q, width, height);
  return { c, width, height, borders: traceBorders(c.label, width, height, c.count) };
}

function expectSound(rows: string[]) {
  const { c, width, height, borders } = trace(rows);
  const { segments, rings, cross } = borders;
  const uses = new Map<number, number>();
  rings.forEach((own, region) => {
    expect(own.length).toBeGreaterThan(0);
    const sums = own.map((ring) => ring.reduce((sum, h) => sum + (h & 1 ? -cross[h >> 1] : cross[h >> 1]), 0));
    expect(sums[0]).toBeLessThan(0);
    for (const hole of sums.slice(1)) expect(hole).toBeGreaterThan(0);
    expect(-sums.reduce((a, b) => a + b, 0) / 2).toBe(c.area[region]);
    for (const ring of own) {
      for (const h of ring) {
        uses.set(h, (uses.get(h) ?? 0) + 1);
        const seg = segments[h >> 1];
        expect(h & 1 ? seg.right : seg.left).toBe(region);
      }
    }
  });
  segments.forEach((seg, s) => {
    expect(seg.left).not.toBe(seg.right);
    if (seg.left >= 0) expect(uses.get(2 * s)).toBe(1);
    if (seg.right >= 0) expect(uses.get(2 * s + 1)).toBe(1);
    expect(seg.points.length).toBeGreaterThanOrEqual(seg.closed ? 6 : 4);
  });
  const puzzle: Puzzle = { id: "", picture: "test", level: "easy", width, height, palette: [], regions: [], segments };
  const polygons = rings.map((own) => regionPolygons(puzzle, { colour: 0, area: 0, box: [0, 0, 0, 0], labels: [], rings: own }, 8));
  for (let region = 0; region < c.count; region++) {
    // Its deepest pixel: the one with the most pixels of its own area around it.
    let best = -1;
    let bestDepth = -1;
    for (let p = 0; p < c.label.length; p++) {
      if (c.label[p] !== region) continue;
      const x = p % width;
      const y = (p - x) / width;
      let depth = 0;
      while (
        depth < 4 &&
        [[-1, 0], [1, 0], [0, -1], [0, 1]].every(([dx, dy]) => {
          const xx = x + dx * (depth + 1);
          const yy = y + dy * (depth + 1);
          return xx >= 0 && yy >= 0 && xx < width && yy < height && c.label[yy * width + xx] === region;
        })
      )
        depth++;
      if (depth > bestDepth) {
        bestDepth = depth;
        best = p;
      }
    }
    if (bestDepth >= 1) expect(contains(polygons[region], (best % width) + 0.5, Math.floor(best / width) + 0.5)).toBe(true);
  }
  return { c, borders };
}

describe("traceBorders", () => {
  it("draws a one-colour picture as four straight sides, pinned at the corners", () => {
    const { borders } = expectSound(["AAAAAA", "AAAAAA", "AAAAAA", "AAAAAA"]);
    expect(borders.segments).toHaveLength(4);
    for (const seg of borders.segments) expect(seg.points).toHaveLength(4);
  });

  it("shares one segment between two halves", () => {
    const { borders } = expectSound(["AAABBB", "AAABBB", "AAABBB"]);
    expect(borders.segments.filter((s) => s.left >= 0 && s.right >= 0)).toHaveLength(1);
  });

  it("handles four areas meeting diagonally (a checkerboard corner)", () => {
    const { c } = expectSound(["AABB", "AABB", "BBAA", "BBAA"]);
    expect(c.count).toBe(4);
  });

  it("handles an area touching itself at a corner, around two holes that touch diagonally", () => {
    const { c, borders } = expectSound(["AAAA", "ABAA", "AABA", "AAAA"]);
    expect(c.count).toBe(3);
    // However its halves chain into rings, the winding is the same: both holes are cut out.
    const puzzle: Puzzle = { id: "", picture: "test", level: "easy", width: 4, height: 4, palette: [], regions: [], segments: borders.segments };
    const outline = regionPolygons(puzzle, { colour: 0, area: 0, box: [0, 0, 0, 0], labels: [], rings: borders.rings[0] }, 8);
    expect(contains(outline, 1.5, 1.5)).toBe(false);
    expect(contains(outline, 2.5, 2.5)).toBe(false);
  });

  it("traces islands as closed loops with no junction, holes within holes", () => {
    const { borders } = expectSound(["AAAAAAA", "ABBBBBA", "ABCCCBA", "ABCCCBA", "ABBBBBA", "AAAAAAA"]);
    expect(borders.segments.filter((s) => s.closed)).toHaveLength(2);
    expect(borders.rings[1]).toHaveLength(2);
  });

  it("stays sound on a noisy map", () => {
    const rows: string[] = [];
    let seed = 7;
    for (let y = 0; y < 24; y++) {
      let row = "";
      for (let x = 0; x < 32; x++) {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        row += "ABC"[seed % 3];
      }
      rows.push(row);
    }
    expectSound(rows);
  });
});
