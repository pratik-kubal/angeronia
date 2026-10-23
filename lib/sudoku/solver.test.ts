import { describe, expect, it } from "vitest";
import { mulberry32 } from "../random";
import { CELLS, PEERS, UNITS } from "./grid";
import { countSolutions, randomSolution, solve, solveBySingles } from "./solver";

/** A well-known puzzle (Wikipedia's Sudoku article) and its solution. */
const PUZZLE = [
  "530070000", "600195000", "098000060",
  "800060003", "400803001", "700020006",
  "060000280", "000419005", "000080079",
].join("").split("").map(Number);
const SOLUTION = [
  "534678912", "672195348", "198342567",
  "859761423", "426853791", "713924856",
  "961537284", "287419635", "345286179",
].join("").split("").map(Number);

const valid = (grid: readonly number[]) =>
  grid.every((d) => d >= 1 && d <= 9) && UNITS.every((u) => new Set(u.cells.map((i) => grid[i])).size === 9);

describe("grid", () => {
  it("gives every cell 20 peers and three units of nine", () => {
    for (let i = 0; i < CELLS; i++) expect(PEERS[i]).toHaveLength(20);
    expect(UNITS).toHaveLength(27);
    for (const u of UNITS) expect(new Set(u.cells).size).toBe(9);
  });
});

describe("solver", () => {
  it("solves a known puzzle, and finds it unique", () => {
    expect(solve(PUZZLE)).toEqual(SOLUTION);
    expect(countSolutions(PUZZLE, 2)).toBe(1);
  });

  it("counts up to the limit on an underconstrained grid", () => {
    expect(countSolutions(Array(CELLS).fill(0), 2)).toBe(2);
    expect(countSolutions(Array(CELLS).fill(0), 5)).toBe(5);
  });

  it("finds no solution where a unit repeats a digit", () => {
    const broken = PUZZLE.slice();
    broken[2] = 5; // row 1 already has a 5
    expect(countSolutions(broken, 2)).toBe(0);
    expect(solve(broken)).toBeNull();
  });

  it("draws valid, seed-stable full grids", () => {
    const a = randomSolution(mulberry32(7));
    expect(valid(a)).toBe(true);
    expect(randomSolution(mulberry32(7))).toEqual(a);
    expect(randomSolution(mulberry32(8))).not.toEqual(a);
  });

  it("solves by singles where singles suffice, and stalls on an empty grid", () => {
    expect(solveBySingles(PUZZLE)).toEqual(SOLUTION);
    expect(solveBySingles(Array(CELLS).fill(0))).toBeNull();
  });
});
