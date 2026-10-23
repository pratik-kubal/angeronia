// Bitmask solvers: a backtracking search (counting solutions, or drawing a random full grid)
// and a singles-only solver that grades how a person would get through a puzzle.

import { ALL, BOXES, CELLS, COLUMNS, ROWS, boxOf, colOf, popcount, rowOf } from "./grid";

type Masks = { row: number[]; col: number[]; box: number[] };

/** The digits each row, column and box already holds, or null when one holds a digit twice. */
function masksOf(cells: readonly number[]): Masks | null {
  const m: Masks = { row: Array(9).fill(0), col: Array(9).fill(0), box: Array(9).fill(0) };
  for (let i = 0; i < CELLS; i++) {
    const d = cells[i];
    if (!d) continue;
    const bit = 1 << d;
    const r = rowOf(i), c = colOf(i), b = boxOf(i);
    if ((m.row[r] | m.col[c] | m.box[b]) & bit) return null;
    m.row[r] |= bit;
    m.col[c] |= bit;
    m.box[b] |= bit;
  }
  return m;
}

const candidates = (m: Masks, i: number) => ALL & ~(m.row[rowOf(i)] | m.col[colOf(i)] | m.box[boxOf(i)]);

function set(cells: number[], m: Masks, i: number, d: number) {
  const bit = 1 << d;
  cells[i] = d;
  m.row[rowOf(i)] |= bit;
  m.col[colOf(i)] |= bit;
  m.box[boxOf(i)] |= bit;
}

function unset(cells: number[], m: Masks, i: number, d: number) {
  const bit = ~(1 << d);
  cells[i] = 0;
  m.row[rowOf(i)] &= bit;
  m.col[colOf(i)] &= bit;
  m.box[boxOf(i)] &= bit;
}

/**
 * Depth-first search that always branches on the empty cell with the fewest candidates.
 * `order` lists a cell's candidate digits in the order to try; `found` is called on each
 * solution (with `cells` filled) and returns true to stop.
 */
function search(cells: number[], m: Masks, order: (mask: number) => number[], found: () => boolean): boolean {
  let best = -1;
  let bestMask = 0;
  let bestCount = 10;
  for (let i = 0; i < CELLS; i++) {
    if (cells[i]) continue;
    const mask = candidates(m, i);
    const n = popcount(mask);
    if (n < bestCount) {
      best = i;
      bestMask = mask;
      bestCount = n;
      if (n <= 1) break;
    }
  }
  if (best < 0) return found();
  for (const d of order(bestMask)) {
    set(cells, m, best, d);
    const stop = search(cells, m, order, found);
    unset(cells, m, best, d);
    if (stop) return true;
  }
  return false;
}

function ascending(mask: number): number[] {
  const out: number[] = [];
  for (let d = 1; d <= 9; d++) if (mask & (1 << d)) out.push(d);
  return out;
}

/** How many solutions the grid has, counting no further than `limit` (2 tells one from many). */
export function countSolutions(grid: readonly number[], limit: number): number {
  const cells = grid.slice();
  const m = masksOf(cells);
  if (!m) return 0;
  let count = 0;
  search(cells, m, ascending, () => ++count >= limit);
  return count;
}

/** The grid's first solution in digit order, or null when it has none. */
export function solve(grid: readonly number[]): number[] | null {
  const cells = grid.slice();
  const m = masksOf(cells);
  if (!m) return null;
  let solution: number[] | null = null;
  search(cells, m, ascending, () => {
    solution = cells.slice();
    return true;
  });
  return solution;
}

/** A complete, valid grid drawn at random: the same search, trying digits in a shuffled order. */
export function randomSolution(rng: () => number): number[] {
  const cells: number[] = Array(CELLS).fill(0);
  const m = masksOf(cells)!;
  let solution: number[] = [];
  const shuffled = (mask: number) => shuffle(ascending(mask), rng);
  search(cells, m, shuffled, () => {
    solution = cells.slice();
    return true;
  });
  return solution;
}

export function shuffle<T>(items: T[], rng: () => number): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

const UNITS = [...ROWS, ...COLUMNS, ...BOXES];

/**
 * Solves with naked singles (a cell with one candidate) and hidden singles (a digit with one
 * place left in a row, column or box) only: the moves a casual player sees without pencil marks.
 * Returns the filled grid, or null where those stall. A puzzle it solves has exactly one solution.
 */
export function solveBySingles(grid: readonly number[]): number[] | null {
  const cells = grid.slice();
  const m = masksOf(cells);
  if (!m) return null;
  let progress = true;
  while (progress) {
    progress = false;
    for (let i = 0; i < CELLS; i++) {
      if (cells[i]) continue;
      const mask = candidates(m, i);
      if (mask === 0) return null;
      if (popcount(mask) === 1) {
        set(cells, m, i, Math.log2(mask));
        progress = true;
      }
    }
    for (const unit of UNITS) {
      for (let d = 1; d <= 9; d++) {
        const bit = 1 << d;
        let spot = -1;
        let spots = 0;
        let placed = false;
        for (const i of unit.cells) {
          if (cells[i] === d) placed = true;
          else if (!cells[i] && candidates(m, i) & bit) {
            spot = i;
            spots++;
          }
        }
        if (placed) continue;
        if (spots === 0) return null;
        if (spots === 1) {
          set(cells, m, spot, d);
          progress = true;
        }
      }
    }
  }
  return cells.every(Boolean) ? cells : null;
}
