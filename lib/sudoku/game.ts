// The game: state, actions and a pure reducer. The solution is known, so a correct digit locks its
// cell and a wrong one is simply refused: nothing is counted and there is no losing (it makes
// guessing by trying digits possible; the game accepts that). A solved board wins a trophy.

import { DIFFICULTY_RULES, generate, type Difficulty } from "./generate";
import { ALL, BOXES, CELLS, COLUMNS, PEERS, ROWS, UNITS_OF, boxOf, colOf, popcount, rowOf, type Unit } from "./grid";

export const HINTS = 3;

/** What a digit finished: the rows, columns and boxes it filled, and whether it was the ninth of its kind. */
export type Finished = { units: Unit[]; digitDone: boolean };

export type Move =
  | ({ kind: "place" | "hint"; seq: number; cell: number; digit: number } & Finished)
  | { kind: "miss"; seq: number; cell: number; digit: number };

export type Status = "playing" | "won";

export type GameState = {
  version: 3;
  difficulty: Difficulty;
  seed: number;
  /** The clues (0 where empty). */
  puzzle: number[];
  solution: number[];
  /** Clues and correct digits so far. */
  grid: number[];
  /** Pencil marks per cell, digit d as bit d. */
  notes: number[];
  selected: number | null;
  notesMode: boolean;
  hintsLeft: number;
  status: Status;
  /** Milliseconds played (the clock stops while the page is hidden). */
  elapsed: number;
  /** The latest move, for its animation; `seq` counts moves. */
  last: Move | null;
  seq: number;
  /** The id of the trophy the solved board won (awarded once, so a reload never draws again). */
  trophy: string | null;
};

export type Action =
  | { type: "load"; state: GameState }
  | { type: "select"; cell: number }
  | { type: "step"; dRow: number; dCol: number }
  | { type: "digit"; digit: number }
  | { type: "notes" }
  | { type: "hint" }
  | { type: "tick"; ms: number }
  | { type: "award"; trophy: string };

export function newGame(difficulty: Difficulty, seed: number): GameState {
  const { puzzle, solution } = generate(difficulty, seed);
  return {
    version: 3,
    difficulty,
    seed,
    puzzle,
    solution,
    grid: puzzle.slice(),
    notes: Array(CELLS).fill(0),
    selected: null,
    notesMode: false,
    hintsLeft: HINTS,
    status: "playing",
    elapsed: 0,
    last: null,
    seq: 0,
    trophy: null,
  };
}

/** How many of each digit (index 1–9) are on the board. */
export function digitCounts(grid: readonly number[]): number[] {
  const counts = Array(10).fill(0);
  for (const d of grid) if (d) counts[d]++;
  return counts;
}

/** What placing `digit` at `cell` finished; `grid` already holds it. */
export function finishedBy(grid: readonly number[], cell: number, digit: number): Finished {
  return {
    units: UNITS_OF[cell].filter((unit) => unit.cells.every((i) => grid[i])),
    digitDone: digitCounts(grid)[digit] === 9,
  };
}

export function reduce(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "load":
      return action.state;
    case "tick":
      return state.status === "playing" ? { ...state, elapsed: state.elapsed + action.ms } : state;
    case "select":
      return { ...state, selected: action.cell };
    case "step": {
      // With nothing selected, the first step selects the top-left cell (the board's tab stop).
      if (state.selected === null) return { ...state, selected: 0 };
      const r = (rowOf(state.selected) + action.dRow + 9) % 9;
      const c = (colOf(state.selected) + action.dCol + 9) % 9;
      return { ...state, selected: r * 9 + c };
    }
    case "notes":
      return { ...state, notesMode: !state.notesMode };
    case "award":
      return state.status === "won" && state.trophy === null ? { ...state, trophy: action.trophy } : state;
    case "digit": {
      const cell = state.selected;
      if (state.status !== "playing" || cell === null || state.grid[cell]) return state;
      if (state.notesMode) {
        const notes = state.notes.slice();
        notes[cell] ^= 1 << action.digit;
        return { ...state, notes };
      }
      if (action.digit !== state.solution[cell]) {
        // Refused: the cell stays as it was; the move is recorded only for its animation.
        const seq = state.seq + 1;
        return { ...state, last: { kind: "miss", seq, cell, digit: action.digit }, seq };
      }
      return fill(state, cell, "place");
    }
    case "hint": {
      if (state.status !== "playing" || state.hintsLeft === 0) return state;
      const cell = state.selected !== null && !state.grid[state.selected] ? state.selected : likeliestCell(state.grid);
      if (cell === null) return state;
      return { ...fill(state, cell, "hint"), hintsLeft: state.hintsLeft - 1 };
    }
  }
}

/**
 * Puts the cell's solution digit in, clears the pencil marks it settles and selects it (on the
 * last cell, the selection clears, so the whole solved board celebrates evenly).
 */
function fill(state: GameState, cell: number, kind: "place" | "hint"): GameState {
  const digit = state.solution[cell];
  const grid = state.grid.slice();
  grid[cell] = digit;
  const notes = state.notes.slice();
  notes[cell] = 0;
  for (const p of PEERS[cell]) notes[p] &= ~(1 << digit);
  const seq = state.seq + 1;
  const won = grid.every(Boolean);
  return {
    ...state,
    grid,
    notes,
    selected: won ? null : cell,
    status: won ? "won" : "playing",
    last: { kind, seq, cell, digit, ...finishedBy(grid, cell, digit) },
    seq,
  };
}

/** The empty cell with the fewest candidates (the first in reading order on a tie), or null. */
function likeliestCell(grid: readonly number[]): number | null {
  const used = (cells: readonly number[]) => cells.reduce((m, i) => m | (1 << grid[i]), 0);
  const rows = ROWS.map((u) => used(u.cells));
  const cols = COLUMNS.map((u) => used(u.cells));
  const boxes = BOXES.map((u) => used(u.cells));
  let best: number | null = null;
  let bestCount = 10;
  for (let i = 0; i < CELLS; i++) {
    if (grid[i]) continue;
    const n = popcount(ALL & ~(rows[rowOf(i)] | cols[colOf(i)] | boxes[boxOf(i)]));
    if (n < bestCount) {
      best = i;
      bestCount = n;
    }
  }
  return best;
}

/** A saved game read back from storage, or null when it isn't one this version wrote. */
export function parseSaved(value: unknown): GameState | null {
  if (!value || typeof value !== "object") return null;
  const s = value as Partial<GameState>;
  const board = (a: unknown) => Array.isArray(a) && a.length === CELLS && a.every((n) => Number.isInteger(n));
  if (s.version !== 3 || !board(s.puzzle) || !board(s.solution) || !board(s.grid) || !board(s.notes)) return null;
  if (s.status !== "playing" && s.status !== "won") return null;
  if (!(s.difficulty! in DIFFICULTY_RULES)) return null;
  const count = (n: unknown) => typeof n === "number" && Number.isFinite(n) && n >= 0;
  if (!count(s.elapsed) || !count(s.seed) || !count(s.seq) || !Number.isInteger(s.hintsLeft) || s.hintsLeft! < 0) return null;
  if (typeof s.notesMode !== "boolean") return null;
  if (s.selected !== null && !(Number.isInteger(s.selected) && s.selected! >= 0 && s.selected! < CELLS)) return null;
  if (s.trophy !== null && typeof s.trophy !== "string") return null;
  const digits = (a: number[], max: number) => a.every((n) => n >= 0 && n <= max);
  if (!digits(s.puzzle!, 9) || !digits(s.solution!, 9) || !digits(s.grid!, 9) || !digits(s.notes!, 0x3fe)) return null;
  return s as GameState;
}
