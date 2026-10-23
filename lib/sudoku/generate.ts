// Puzzle generation: a random full grid, then dig cells out while the puzzle stays fair.

import { mulberry32, shuffle } from "../random";
import { CELLS } from "./grid";
import { countSolutions, randomSolution, solveBySingles } from "./solver";

export type Difficulty = "easy" | "medium" | "hard";

export const DIFFICULTIES: readonly Difficulty[] = ["easy", "medium", "hard"];

/**
 * The clues each difficulty digs down to, and whether singles alone solve it: easy and medium
 * never need pencil marks or a guess; hard always does (it keeps one solution). A dig can stop
 * a few clues short when no pair comes out cleanly.
 */
export const DIFFICULTY_RULES: Record<Difficulty, { clues: number; singles: boolean }> = {
  easy: { clues: 38, singles: true },
  medium: { clues: 30, singles: true },
  hard: { clues: 24, singles: false },
};

export type Puzzle = { puzzle: number[]; solution: number[] };

/**
 * A puzzle with exactly one solution, the same for the same difficulty and seed. Cells come out
 * in mirrored pairs (i and 80 − i, so the clues keep the classic half-turn symmetry) in a random
 * order; a pair goes back in when taking it out breaks the difficulty's rule.
 */
export function generate(difficulty: Difficulty, seed: number): Puzzle {
  const rng = mulberry32(seed);
  const { singles } = DIFFICULTY_RULES[difficulty];
  for (;;) {
    const dug = dig(difficulty, rng);
    if (singles || !solveBySingles(dug.puzzle)) return dug;
  }
}

function dig(difficulty: Difficulty, rng: () => number): Puzzle {
  const solution = randomSolution(rng);
  const puzzle = solution.slice();
  const { clues, singles } = DIFFICULTY_RULES[difficulty];
  const fair = (grid: number[]) => (singles ? solveBySingles(grid) !== null : countSolutions(grid, 2) === 1);

  let left = CELLS;
  const order = shuffle(
    Array.from({ length: 41 }, (_, i) => i),
    rng,
  );
  for (const i of order) {
    if (left <= clues) break;
    const pair = i === 40 ? [40] : [i, CELLS - 1 - i];
    if (left - pair.length < clues) continue;
    for (const j of pair) puzzle[j] = 0;
    if (fair(puzzle)) left -= pair.length;
    else for (const j of pair) puzzle[j] = solution[j];
  }
  return { puzzle, solution };
}
