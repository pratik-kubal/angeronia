// The game: what a painting is made of, its state, a pure reducer and the saved form. An area takes
// only its own colour, so a wrong tap is simply refused: nothing is recorded, nothing is reset and
// there is no losing. Painted areas are locked. The screen asks the selectors here what to show
// (each colour's progress, the next unfinished colour, where the magnifier flies, the order
// auto-paint paints in) and saves the fill order, which is the whole game: the rest is derived.

import type { LevelId, Puzzle } from "./types";

/** The saved form's area indices are Uint16s. */
const MAX_REGIONS = 0x10000;
/** The most magnifier uses a save may hold: far above any level's, far below anything silly. */
const MAX_MAGNIFIERS = 99;

/** What the rules need from a puzzle, flattened into typed arrays once per puzzle. */
export interface Board {
  /** How many areas there are. */
  regions: number;
  /** How many colours the palette has. */
  colours: number;
  /** Each area's palette index. */
  colourOf: Uint8Array;
  /** Each area's size, in work px. */
  area: Uint32Array;
  /** Each area's main label (the point its number is drawn at), in work px. */
  labelX: Float32Array;
  labelY: Float32Array;
  /** How many areas each colour has. */
  total: Int32Array;
}

export function makeBoard(puzzle: Puzzle): Board {
  const regions = puzzle.regions.length;
  const colours = puzzle.palette.length;
  if (regions > MAX_REGIONS) throw new Error(`Color Tap: ${regions} areas will not fit a save`);
  if (colours > 0x100) throw new Error(`Color Tap: ${colours} colours will not fit a Uint8Array`);
  const colourOf = new Uint8Array(regions);
  const area = new Uint32Array(regions);
  const labelX = new Float32Array(regions);
  const labelY = new Float32Array(regions);
  const total = new Int32Array(colours);
  puzzle.regions.forEach((region, i) => {
    if (!Number.isInteger(region.colour) || region.colour < 0 || region.colour >= colours) throw new Error(`Color Tap: area ${i} has no colour`);
    const main = region.labels[0];
    if (!main) throw new Error(`Color Tap: area ${i} has no label`);
    colourOf[i] = region.colour;
    area[i] = region.area;
    labelX[i] = main.x;
    labelY[i] = main.y;
    total[region.colour]++;
  });
  return { regions, colours, colourOf, area, labelX, labelY, total };
}

export interface GameState {
  version: 1;
  picture: string;
  level: LevelId;
  /** The puzzle's id (Puzzle.id), so a save is never laid over a regenerated puzzle. */
  puzzle: string;
  /** The painted areas, in the order they were painted (the finished painting's replay). */
  order: number[];
  /** 1 for each painted area, kept in step with `order`, so a lookup never searches it. */
  painted: Uint8Array;
  /** How many of `order` auto-paint painted (the replay is skipped when it painted most). */
  auto: number;
  /** The selected palette index. */
  selected: number;
  /** Magnifier uses left. */
  magnifiers: number;
  /** Milliseconds spent painting (the screen stops ticking while the page is hidden). */
  elapsed: number;
  /** Every area is painted. */
  done: boolean;
}

export type Action =
  /** Pick a colour; one out of range is ignored. */
  | { type: "select"; colour: number }
  /**
   * Paint an area. Refused (the same state back) when it is out of range, already painted, or, from
   * a tap (`auto` false), not the selected colour. Auto-paint may paint any open area, and selects
   * its colour as it goes, so the palette follows along.
   */
  | { type: "fill"; area: number; auto: boolean }
  /** Spend one magnifier use; there is never fewer than none. */
  | { type: "magnify" }
  /** Time passes; a finished painting's clock has stopped, and junk is ignored. */
  | { type: "tick"; ms: number }
  /** The same picture, level and puzzle, blank again, with the level's magnifiers. */
  | { type: "restart"; magnifiers: number };

/** A blank painting, with colour 1 (palette index 0) selected. */
export function newGame(board: Board, picture: string, level: LevelId, puzzle: string, magnifiers: number): GameState {
  return {
    version: 1,
    picture,
    level,
    puzzle,
    order: [],
    painted: new Uint8Array(board.regions),
    auto: 0,
    selected: 0,
    magnifiers,
    elapsed: 0,
    done: board.regions === 0,
  };
}

const isIndex = (n: unknown, length: number): n is number => typeof n === "number" && Number.isInteger(n) && n >= 0 && n < length;

/** Pure: never touches `state`, and hands back the very same object when nothing changes. */
export function reduce(state: GameState, action: Action, board: Board): GameState {
  switch (action.type) {
    case "select":
      if (!isIndex(action.colour, board.colours) || action.colour === state.selected) return state;
      return { ...state, selected: action.colour };
    case "fill": {
      const a = action.area;
      if (!isIndex(a, board.regions) || state.painted[a] === 1) return state;
      if (!action.auto && board.colourOf[a] !== state.selected) return state;
      const painted = state.painted.slice();
      painted[a] = 1;
      const order = [...state.order, a];
      return {
        ...state,
        order,
        painted,
        auto: state.auto + (action.auto ? 1 : 0),
        selected: action.auto ? board.colourOf[a] : state.selected,
        done: order.length === board.regions,
      };
    }
    case "magnify":
      return state.magnifiers > 0 ? { ...state, magnifiers: state.magnifiers - 1 } : state;
    case "tick":
      if (state.done || !Number.isFinite(action.ms) || action.ms <= 0) return state;
      return { ...state, elapsed: state.elapsed + action.ms };
    case "restart": {
      const blank = state.order.length === 0 && state.auto === 0 && state.selected === 0 && state.elapsed === 0;
      if (blank && state.magnifiers === action.magnifiers) return state;
      return newGame(board, state.picture, state.level, state.puzzle, action.magnifiers);
    }
  }
}

/** How many areas of each colour are painted. */
export function colourProgress(state: GameState, board: Board): Int32Array {
  const done = new Int32Array(board.colours);
  for (const a of state.order) done[board.colourOf[a]]++;
  return done;
}

/** Whether every area of the colour is painted; false for a colour the palette doesn't have. */
export function isColourDone(state: GameState, board: Board, colour: number): boolean {
  if (!isIndex(colour, board.colours)) return false;
  let painted = 0;
  for (const a of state.order) if (board.colourOf[a] === colour) painted++;
  return painted === board.total[colour];
}

/**
 * The colour auto-advance moves to: the first unfinished one after `from` in number order, wrapping
 * round, with `from` itself last (so -1 asks for the first unfinished colour of all). -1 when every
 * colour is done.
 */
export function nextColour(state: GameState, board: Board, from: number): number {
  const n = board.colours;
  const progress = colourProgress(state, board);
  for (let k = 1; k <= n; k++) {
    const c = (((from + k) % n) + n) % n;
    if (progress[c] < board.total[c]) return c;
  }
  return -1;
}

/** The colour's unpainted areas, lowest index first. */
export function openAreas(state: GameState, board: Board, colour: number): number[] {
  const open: number[] = [];
  for (let a = 0; a < board.regions; a++) if (board.colourOf[a] === colour && state.painted[a] === 0) open.push(a);
  return open;
}

const distance2 = (board: Board, a: number, x: number, y: number) => (board.labelX[a] - x) ** 2 + (board.labelY[a] - y) ** 2;

/**
 * Where the magnifier flies, from the areas the screen found hard to see: the smallest, since it is
 * the hardest to find by eye; on a tie the one whose number is nearest the view's centre (the
 * shortest flight); then the lower index. -1 when there are none (an index out of range counts as
 * none).
 */
export function magnifierTarget(candidates: readonly number[], board: Board, centre: { x: number; y: number }): number {
  let best = -1;
  let bestArea = 0;
  let bestDistance = 0;
  for (const a of candidates) {
    if (!isIndex(a, board.regions)) continue;
    const size = board.area[a];
    const d = distance2(board, a, centre.x, centre.y);
    if (best === -1 || size < bestArea || (size === bestArea && (d < bestDistance || (d === bestDistance && a < best)))) {
      best = a;
      bestArea = size;
      bestDistance = d;
    }
  }
  return best;
}

/**
 * The order auto-paint paints in: every unpainted area once, colour by colour in number order from
 * the selected colour, wrapping round. Within a colour the brush hops to the nearest number: first
 * the one nearest `start`, then the one nearest the area just chosen (ties to the lower index), so
 * each colour spreads out from `start` instead of jumping about the picture.
 */
export function autoPlan(state: GameState, board: Board, start: { x: number; y: number }): number[] {
  const plan: number[] = [];
  const n = board.colours;
  for (let k = 0; k < n; k++) {
    const colour = (state.selected + k) % n;
    const open = openAreas(state, board, colour);
    const taken = new Uint8Array(open.length);
    let x = start.x;
    let y = start.y;
    for (let step = 0; step < open.length; step++) {
      let pick = -1;
      let pickDistance = 0;
      // `open` is ascending, so a strict < keeps the lower index on a tie.
      for (let i = 0; i < open.length; i++) {
        if (taken[i] === 1) continue;
        const d = distance2(board, open[i], x, y);
        if (pick === -1 || d < pickDistance) {
          pick = i;
          pickDistance = d;
        }
      }
      taken[pick] = 1;
      const a = open[pick];
      plan.push(a);
      x = board.labelX[a];
      y = board.labelY[a];
    }
  }
  return plan;
}

// ── the saved form ─────────────────────────────────────────────────────────

/** A game in storage: the fill order is the painting; `painted` and `done` are rebuilt from it. */
export interface Saved {
  v: 1;
  picture: string;
  level: LevelId;
  puzzle: string;
  /** The fill order: base64 of little-endian Uint16 area indices. */
  order: string;
  auto: number;
  selected: number;
  magnifiers: number;
  elapsed: number;
}

/** Strict base64 as btoa writes it: padded, no whitespace. */
const BASE64 = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

// btoa and atob on a binary string, as lib/color-tap/puzzle.ts does, so this runs in browsers and Node.
function encodeOrder(order: readonly number[]): string {
  const bytes = new Uint8Array(order.length * 2);
  const view = new DataView(bytes.buffer);
  order.forEach((a, i) => view.setUint16(i * 2, a, true));
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

/** The indices, or null when the text isn't a whole number of them. */
function decodeOrder(text: string): number[] | null {
  if (!BASE64.test(text)) return null;
  const binary = atob(text);
  if (binary.length % 2 !== 0) return null;
  const order = new Array<number>(binary.length / 2);
  for (let i = 0; i < order.length; i++) order[i] = binary.charCodeAt(i * 2) | (binary.charCodeAt(i * 2 + 1) << 8);
  return order;
}

export function toSaved(state: GameState): Saved {
  return {
    v: 1,
    picture: state.picture,
    level: state.level,
    puzzle: state.puzzle,
    order: encodeOrder(state.order),
    auto: state.auto,
    selected: state.selected,
    magnifiers: state.magnifiers,
    elapsed: state.elapsed,
  };
}

/**
 * A saved game read back from storage, or null unless it is exactly one this version wrote for this
 * picture, level and puzzle: a regenerated puzzle voids its saves, since its areas are not the same.
 */
export function parseSaved(value: unknown, board: Board, expected: { picture: string; level: LevelId; puzzle: string }): GameState | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const s = value as Partial<Record<keyof Saved, unknown>>;
  if (s.v !== 1 || s.picture !== expected.picture || s.level !== expected.level || s.puzzle !== expected.puzzle) return null;
  if (typeof s.order !== "string") return null;
  const order = decodeOrder(s.order);
  if (order === null) return null;
  const painted = new Uint8Array(board.regions);
  for (const a of order) {
    if (!isIndex(a, board.regions) || painted[a] === 1) return null;
    painted[a] = 1;
  }
  const whole = (n: unknown, max: number): n is number => typeof n === "number" && Number.isInteger(n) && n >= 0 && n <= max;
  if (!whole(s.auto, order.length) || !whole(s.magnifiers, MAX_MAGNIFIERS) || !isIndex(s.selected, board.colours)) return null;
  if (typeof s.elapsed !== "number" || !Number.isFinite(s.elapsed) || s.elapsed < 0) return null;
  return {
    version: 1,
    picture: expected.picture,
    level: expected.level,
    puzzle: expected.puzzle,
    order,
    painted,
    auto: s.auto,
    selected: s.selected,
    magnifiers: s.magnifiers,
    elapsed: s.elapsed,
    done: order.length === board.regions,
  };
}
