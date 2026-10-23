// Klondike, turn three: state, actions and a pure reducer. A game is its deal's seed plus a log of
// moves, each a short token ("s" taps the stock; "wt3", "t6f1", "t2t5", "f0t3" move cards from one
// pile to another), so a save is tiny, undo is "replay all but the last" and a saved log is checked
// by replaying it. Scoring is Windows Standard.

import { isRed, rankOf, suitOf, type Card } from "./cards";
import { DEAL_VERSION, deal, type Column, type Table } from "./deal";

export type { Column, Table } from "./deal";

export type PileId = "s" | "w" | "f0" | "f1" | "f2" | "f3" | "t0" | "t1" | "t2" | "t3" | "t4" | "t5" | "t6";
export const FOUNDATION_IDS = ["f0", "f1", "f2", "f3"] as const;
export const TABLEAU_IDS = ["t0", "t1", "t2", "t3", "t4", "t5", "t6"] as const;
export const PILE_IDS: readonly PileId[] = ["s", "w", ...FOUNDATION_IDS, ...TABLEAU_IDS];

/** Cards turned from the stock at a time. */
export const DRAW = 3;
/** Windows Standard scoring. A recycle costs only after the free ones (none in Windows' draw three). */
export const POINTS = { wasteToTableau: 5, toFoundation: 10, flip: 5, foundationToTableau: -15, recycle: -20 } as const;
export const FREE_RECYCLES = 0;
/** −2 for every 10 s played; a win in more than 30 s adds 700,000 ÷ seconds. */
export const TIME_PENALTY = { points: 2, everyMs: 10_000 } as const;
/** A saved log longer than this is cut to it (no real game comes near). */
export const MAX_MOVES = 5000;

export type Status = "playing" | "won";

/** What one move did: the cards it moved (in the order they land) and the card it turned over. */
export type Effect = { token: string; cards: Card[]; flipped: Card | null; recycled: boolean };

export type GameState = {
  version: 1;
  seed: number;
  table: Table;
  /** Every move made, as tokens. */
  log: string[];
  /** The moves' points (score() takes the time off and adds the win bonus). */
  points: number;
  recycles: number;
  /** Milliseconds played: the clock starts at the first move and stops at the win. */
  elapsed: number;
  hints: number;
  status: Status;
  /** Counted as played in the stats (at its first move). */
  counted: boolean;
  /** Its win recorded in the stats. */
  recorded: boolean;
  /** Bumped by every change to the log or the table. */
  rev: number;
  /** The latest change, for its animation and the live region. */
  last: Last | null;
};

export type ChangeKind = "move" | "finish" | "undo" | "restart";
export type Last = { rev: number; kind: ChangeKind; effects: Effect[] };

export type Action =
  | { type: "load"; state: GameState }
  /** Turn up to three cards, or turn the waste back over when the stock is empty. */
  | { type: "stock" }
  | { type: "move"; from: PileId; to: PileId; count: number }
  /** Play every remaining card to the foundations (only once all are face up). */
  | { type: "finish" }
  | { type: "undo" }
  | { type: "restart" }
  | { type: "tick"; ms: number }
  | { type: "hint" }
  | { type: "mark"; counted?: true; recorded?: true };

export function newGame(seed: number): GameState {
  return {
    version: 1,
    seed,
    table: deal(seed),
    log: [],
    points: 0,
    recycles: 0,
    elapsed: 0,
    hints: 0,
    status: "playing",
    counted: false,
    recorded: false,
    rev: 0,
    last: null,
  };
}

// ── piles ──────────────────────────────────────────────────────────────────

const foundationIndex = (pile: PileId) => (pile[0] === "f" ? Number(pile[1]) : -1);
const columnIndex = (pile: PileId) => (pile[0] === "t" ? Number(pile[1]) : -1);
const top = <T>(a: readonly T[]): T | undefined => a[a.length - 1];

/** The cards of a pile, bottom first (a column's face-down cards included). */
export function pileCards(table: Table, pile: PileId): Card[] {
  if (pile === "s") return table.stock;
  if (pile === "w") return table.waste;
  const f = foundationIndex(pile);
  if (f >= 0) return table.foundations[f];
  const col = table.tableau[columnIndex(pile)];
  return [...col.down, ...col.up];
}

export const isEmptyColumn = (col: Column) => col.down.length === 0 && col.up.length === 0;

/** Whether `card` goes on foundation `f` next. */
export const fitsFoundation = (table: Table, card: Card, f: number) =>
  suitOf(card) === f && table.foundations[f].length === rankOf(card) - 1;

/** Whether `card` goes on `col` (a King on an empty column; otherwise one lower, other colour). */
export function fitsColumn(col: Column, card: Card): boolean {
  const t = top(col.up);
  if (t === undefined) return col.down.length === 0 && rankOf(card) === 13;
  return rankOf(card) === rankOf(t) - 1 && isRed(card) !== isRed(t);
}

/**
 * How many cards move from `from` to `to`, or null when nothing can. A face-up run strictly
 * descends in alternating colours, so at most one of its cards fits a given column: the count is
 * never a choice, and the reducer, a tap, a drag and a replay all agree on it.
 */
export function legalCount(table: Table, from: PileId, to: PileId): number | null {
  if (from === to || from === "s" || to === "s" || to === "w") return null;
  const f = foundationIndex(to);
  const t = columnIndex(to);
  if (from === "w" || from[0] === "f") {
    const card = top(pileCards(table, from));
    if (card === undefined) return null;
    if (f >= 0) return from === "w" && fitsFoundation(table, card, f) ? 1 : null;
    return fitsColumn(table.tableau[t], card) ? 1 : null;
  }
  const up = table.tableau[columnIndex(from)].up;
  if (up.length === 0) return null;
  if (f >= 0) return fitsFoundation(table, up[up.length - 1], f) ? 1 : null;
  const target = table.tableau[t];
  for (let k = 0; k < up.length; k++) if (fitsColumn(target, up[k])) return up.length - k;
  return null;
}

/** Whether every card is face up with the stock and waste empty: the rest plays itself out. */
export const canFinish = (table: Table) =>
  table.stock.length === 0 &&
  table.waste.length === 0 &&
  table.tableau.every((c) => c.down.length === 0) &&
  table.foundations.some((f) => f.length < 13);

export const isWon = (table: Table) => table.foundations.every((f) => f.length === 13);

// ── tokens ─────────────────────────────────────────────────────────────────

const TOKEN = /^(?:s|(w|f[0-3]|t[0-6])(f[0-3]|t[0-6]))$/;
export const isToken = (token: string) => TOKEN.test(token);
export const moveToken = (from: PileId, to: PileId) => `${from}${to}`;
/** A move token's piles; null for the stock token or junk. */
export function parseToken(token: string): { from: PileId; to: PileId } | null {
  const m = TOKEN.exec(token);
  return m && m[1] ? { from: m[1] as PileId, to: m[2] as PileId } : null;
}

// ── applying a move ────────────────────────────────────────────────────────

type Applied = { table: Table; effect: Effect; points: number };

/** Taps the stock: three cards (or what's left) onto the waste, or the waste turned back over. */
function tapStock(table: Table, recycles: number): Applied | null {
  if (table.stock.length > 0) {
    const n = Math.min(DRAW, table.stock.length);
    const stock = table.stock.slice(0, table.stock.length - n);
    const drawn = table.stock.slice(table.stock.length - n).reverse();
    return {
      table: { ...table, stock, waste: [...table.waste, ...drawn], fan: n },
      effect: { token: "s", cards: drawn, flipped: null, recycled: false },
      points: 0,
    };
  }
  if (table.waste.length === 0) return null;
  return {
    table: { ...table, stock: table.waste.slice().reverse(), waste: [], fan: 0 },
    effect: { token: "s", cards: table.waste.slice().reverse(), flipped: null, recycled: true },
    points: recycles >= FREE_RECYCLES ? POINTS.recycle : 0,
  };
}

function moveCards(table: Table, from: PileId, to: PileId): Applied | null {
  const count = legalCount(table, from, to);
  if (count === null) return null;
  let cards: Card[];
  let flipped: Card | null = null;
  const next: Table = { ...table };
  if (from === "w") {
    cards = table.waste.slice(-1);
    next.waste = table.waste.slice(0, -1);
    next.fan = Math.max(0, table.fan - 1);
  } else if (from[0] === "f") {
    const f = foundationIndex(from);
    cards = table.foundations[f].slice(-1);
    next.foundations = table.foundations.map((p, i) => (i === f ? p.slice(0, -1) : p));
  } else {
    const c = columnIndex(from);
    const col = table.tableau[c];
    cards = col.up.slice(col.up.length - count);
    let rest: Column = { down: col.down, up: col.up.slice(0, col.up.length - count) };
    if (rest.up.length === 0 && rest.down.length > 0) {
      flipped = rest.down[rest.down.length - 1];
      rest = { down: rest.down.slice(0, -1), up: [flipped] };
    }
    next.tableau = table.tableau.map((p, i) => (i === c ? rest : p));
  }
  const f = foundationIndex(to);
  if (f >= 0) next.foundations = next.foundations.map((p, i) => (i === f ? [...p, ...cards] : p));
  else {
    const t = columnIndex(to);
    next.tableau = next.tableau.map((p, i) => (i === t ? { down: p.down, up: [...p.up, ...cards] } : p));
  }
  let points = flipped === null ? 0 : POINTS.flip;
  if (f >= 0) points += POINTS.toFoundation;
  else if (from === "w") points += POINTS.wasteToTableau;
  else if (from[0] === "f") points += POINTS.foundationToTableau;
  return { table: next, effect: { token: moveToken(from, to), cards, flipped, recycled: false }, points };
}

/** One logged move applied to a state, or null when it isn't legal there. */
function play(state: GameState, token: string): { state: GameState; effect: Effect } | null {
  if (state.status !== "playing") return null;
  let applied: Applied | null;
  if (token === "s") applied = tapStock(state.table, state.recycles);
  else {
    const move = parseToken(token);
    applied = move && moveCards(state.table, move.from, move.to);
  }
  if (!applied) return null;
  const won = isWon(applied.table);
  return {
    state: {
      ...state,
      table: applied.table,
      log: [...state.log, token],
      points: state.points + applied.points,
      recycles: state.recycles + (applied.effect.recycled ? 1 : 0),
      status: won ? "won" : "playing",
    },
    effect: applied.effect,
  };
}

/** The moves that play every remaining card to the foundations, lowest first (see canFinish). */
export function finishMoves(table: Table): string[] {
  if (!canFinish(table)) return [];
  const tokens: string[] = [];
  let t = table;
  while (!isWon(t)) {
    let best = -1;
    for (let c = 0; c < 7; c++) {
      const card = top(t.tableau[c].up);
      if (card !== undefined && (best < 0 || rankOf(card) < rankOf(top(t.tableau[best].up)!))) best = c;
    }
    const from = TABLEAU_IDS[best];
    const to = FOUNDATION_IDS[suitOf(top(t.tableau[best].up)!)];
    t = moveCards(t, from, to)!.table;
    tokens.push(moveToken(from, to));
  }
  return tokens;
}

/** A seed's game after `tokens`, as far as they stay legal (`applied` of them). */
export function replay(seed: number, tokens: readonly string[]): { state: GameState; applied: number } {
  let state = newGame(seed);
  let applied = 0;
  for (const token of tokens) {
    const next = play(state, token);
    if (!next) break;
    state = next.state;
    applied++;
  }
  return { state, applied };
}

/** The score shown: the moves' points, less 2 every 10 s, plus the win's time bonus; never below 0. */
export function score(state: GameState): number {
  const seconds = Math.floor(state.elapsed / 1000);
  const bonus = state.status === "won" && seconds > 30 ? Math.floor(700_000 / seconds) : 0;
  const penalty = TIME_PENALTY.points * Math.floor(state.elapsed / TIME_PENALTY.everyMs);
  return Math.max(0, state.points - penalty + bonus);
}

// ── the reducer ────────────────────────────────────────────────────────────

const changed = (state: GameState, next: GameState, kind: ChangeKind, effects: Effect[]): GameState => {
  const rev = state.rev + 1;
  return { ...next, rev, last: { rev, kind, effects } };
};

export function reduce(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "load":
      return action.state;
    case "tick":
      return state.status === "playing" && state.log.length > 0 ? { ...state, elapsed: state.elapsed + action.ms } : state;
    case "hint":
      return { ...state, hints: state.hints + 1 };
    case "mark":
      return {
        ...state,
        counted: state.counted || action.counted === true,
        recorded: state.recorded || action.recorded === true,
      };
    case "stock": {
      const next = play(state, "s");
      return next ? changed(state, next.state, "move", [next.effect]) : state;
    }
    case "move": {
      if (legalCount(state.table, action.from, action.to) !== action.count) return state;
      const next = play(state, moveToken(action.from, action.to));
      return next ? changed(state, next.state, "move", [next.effect]) : state;
    }
    case "finish": {
      const tokens = finishMoves(state.table);
      if (tokens.length === 0 || state.status !== "playing") return state;
      let s = state;
      const effects: Effect[] = [];
      for (const token of tokens) {
        const next = play(s, token)!;
        s = next.state;
        effects.push(next.effect);
      }
      return changed(state, s, "finish", effects);
    }
    case "undo": {
      if (state.status !== "playing" || state.log.length === 0) return state;
      const { state: back } = replay(state.seed, state.log.slice(0, -1));
      return changed(state, { ...back, elapsed: state.elapsed, hints: state.hints, counted: state.counted, recorded: state.recorded }, "undo", []);
    }
    case "restart": {
      if (state.log.length === 0) return state;
      return changed(state, { ...newGame(state.seed), hints: 0, counted: state.counted, recorded: state.recorded }, "restart", []);
    }
  }
}

// ── saving ─────────────────────────────────────────────────────────────────

export type Saved = {
  v: 1;
  deal: number;
  seed: number;
  moves: string[];
  elapsed: number;
  hints: number;
  counted: boolean;
  recorded: boolean;
  rev: number;
};

export const toSaved = (state: GameState): Saved => ({
  v: 1,
  deal: DEAL_VERSION,
  seed: state.seed,
  moves: state.log,
  elapsed: state.elapsed,
  hints: state.hints,
  counted: state.counted,
  recorded: state.recorded,
  rev: state.rev,
});

/**
 * A saved game read back from storage: its moves are replayed from the deal, and only the longest
 * legal run of them is kept (a rule fixed later never throws a game away). Null when it isn't one
 * this version wrote, or another deal version's.
 */
export function parseSaved(value: unknown): GameState | null {
  if (!value || typeof value !== "object") return null;
  const s = value as Partial<Saved>;
  if (s.v !== 1 || s.deal !== DEAL_VERSION) return null;
  const count = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n) && n >= 0;
  if (!count(s.seed) || !Number.isInteger(s.seed) || !count(s.elapsed) || !count(s.hints) || !count(s.rev)) return null;
  if (typeof s.counted !== "boolean" || typeof s.recorded !== "boolean") return null;
  if (!Array.isArray(s.moves) || !s.moves.every((m) => typeof m === "string" && isToken(m))) return null;
  const { state } = replay(s.seed, s.moves.slice(0, MAX_MOVES));
  return {
    ...state,
    elapsed: s.elapsed,
    hints: Math.floor(s.hints),
    counted: s.counted,
    recorded: s.recorded,
    rev: Math.floor(s.rev),
    last: null,
  };
}
