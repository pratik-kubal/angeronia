import { describe, expect, it } from "vitest";
import { CELLS } from "./grid";
import { DIFFICULTIES, DIFFICULTY_RULES, generate } from "./generate";
import { countSolutions, solveBySingles } from "./solver";

const clues = (grid: readonly number[]) => grid.filter(Boolean).length;

describe("generate", () => {
  it("is the same puzzle for the same difficulty and seed", () => {
    expect(generate("medium", 42)).toEqual(generate("medium", 42));
    expect(generate("medium", 42)).not.toEqual(generate("medium", 43));
  });

  for (const difficulty of DIFFICULTIES) {
    it(`digs ${difficulty} puzzles with one solution, near their clue target`, () => {
      const { clues: target, singles } = DIFFICULTY_RULES[difficulty];
      for (let seed = 1; seed <= 20; seed++) {
        const { puzzle, solution } = generate(difficulty, seed);
        expect(countSolutions(puzzle, 2)).toBe(1);
        // The clues are the solution's digits, with the half-turn symmetry.
        for (let i = 0; i < CELLS; i++) {
          if (puzzle[i]) expect(puzzle[i]).toBe(solution[i]);
          expect(Boolean(puzzle[i])).toBe(Boolean(puzzle[CELLS - 1 - i]));
        }
        expect(clues(puzzle)).toBeGreaterThanOrEqual(target);
        expect(clues(puzzle)).toBeLessThanOrEqual(target + 8);
        // Easy and medium never need more than singles; hard always does.
        expect(solveBySingles(puzzle) !== null).toBe(singles);
      }
    });
  }

  it("orders the difficulties by clues", () => {
    const mean = (d: (typeof DIFFICULTIES)[number]) =>
      Array.from({ length: 10 }, (_, s) => clues(generate(d, s + 1).puzzle)).reduce((a, b) => a + b) / 10;
    expect(mean("easy")).toBeGreaterThan(mean("medium"));
    expect(mean("medium")).toBeGreaterThan(mean("hard"));
  });
});
