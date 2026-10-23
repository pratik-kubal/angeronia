// A Klondike (turn three) solver: a depth-first search that sees every card, face-down ones
// included, so "won" means the deal can be won, the standard meaning of a winnable deal. It proves
// the deal bank (scripts/build-solitaire-deals.ts) and backs the Hint button.
//
// It searches a smaller game than the player's: draws are folded into talon moves (talon.ts: each
// waste top the stock can bring up is one move), safe cards go to the foundations unasked, cards
// never come back off a foundation, and moves that can't help (a bare King between empty columns,
// a run moved between columns for nothing) are skipped. So it can miss a win, never invent one:
// "unknown" is all it says when it gives up, and every win comes back as the player's own moves
// (game.ts tokens), which callers replay through the reducer.

import { isRed, rankOf, suitOf, type Card } from "./cards";
import type { Table } from "./deal";
import { reachable } from "./talon";

export type SolveResult = { status: "won"; moves: string[]; nodes: number } | { status: "unknown"; nodes: number };

type State = {
  /** Cards on each foundation (its top rank). */
  found: number[];
  /** Each column's face-down cards: never changed, only counted down. */
  downs: readonly Card[][];
  downN: number[];
  ups: Card[][];
  /** The talon in dealing order, and the waste's size (talon.ts). */
  talon: Card[];
  p: number;
};

const RANK = Array.from({ length: 52 }, (_, c) => rankOf(c));
const SUIT = Array.from({ length: 52 }, (_, c) => suitOf(c));
const RED = Array.from({ length: 52 }, (_, c) => isRed(c));

const fromTable = (t: Table): State => ({
  found: t.foundations.map((f) => f.length),
  downs: t.tableau.map((c) => c.down.slice()),
  downN: t.tableau.map((c) => c.down.length),
  ups: t.tableau.map((c) => c.up.slice()),
  talon: [...t.waste, ...t.stock.slice().reverse()],
  p: t.waste.length,
});

const fitsFoundation = (s: State, card: Card) => s.found[SUIT[card]] === RANK[card] - 1;

function fitsColumn(s: State, col: number, card: Card): boolean {
  const up = s.ups[col];
  if (up.length === 0) return s.downN[col] === 0 && RANK[card] === 13;
  const top = up[up.length - 1];
  return RANK[card] === RANK[top] - 1 && RED[card] !== RED[top];
}

/**
 * Whether a card can go up with nothing lost: a two or lower always, or when both foundations of
 * the other colour already hold its rank − 1 (no card it could carry is still out).
 */
function safeUp(s: State, card: Card): boolean {
  const r = RANK[card];
  if (r <= 2) return true;
  const a = (SUIT[card] + 1) % 4;
  const b = (SUIT[card] + 3) % 4;
  return s.found[a] >= r - 1 && s.found[b] >= r - 1;
}

/** Takes `count` cards off column `c` (turning over the card underneath), returning the new arrays. */
function takeFromColumn(s: State, c: number, count: number): { ups: Card[][]; downN: number[] } {
  const ups = s.ups.slice();
  let downN = s.downN;
  const rest = s.ups[c].slice(0, s.ups[c].length - count);
  if (rest.length === 0 && s.downN[c] > 0) {
    downN = s.downN.slice();
    downN[c]--;
    rest.push(s.downs[c][downN[c]]);
  }
  ups[c] = rest;
  return { ups, downN };
}

const COL = (c: number) => `t${c}`;
const FND = (card: Card) => `f${SUIT[card]}`;

/** A candidate move: the state after it, the player's tokens for it, and its search priority. */
type Move = { next: State; tokens: string[]; order: number };

function toFoundation(s: State, card: Card): number[] {
  const found = s.found.slice();
  found[SUIT[card]]++;
  return found;
}

function generate(s: State): Move[] {
  const moves: Move[] = [];
  let emptyTarget = -1;
  for (let c = 0; c < 7; c++) if (s.ups[c].length === 0 && s.downN[c] === 0) {
    emptyTarget = c;
    break;
  }
  // Tableau tops to the foundations.
  for (let c = 0; c < 7; c++) {
    const up = s.ups[c];
    if (up.length === 0) continue;
    const card = up[up.length - 1];
    if (!fitsFoundation(s, card)) continue;
    const { ups, downN } = takeFromColumn(s, c, 1);
    moves.push({ next: { ...s, ups, downN, found: toFoundation(s, card) }, tokens: [`${COL(c)}${FND(card)}`], order: 0 });
  }
  // Tableau to tableau.
  for (let c = 0; c < 7; c++) {
    const up = s.ups[c];
    if (up.length === 0) continue;
    for (let t = 0; t < 7; t++) {
      if (t === c) continue;
      const empty = s.ups[t].length === 0 && s.downN[t] === 0;
      if (empty && t !== emptyTarget) continue;
      let k = -1;
      for (let i = 0; i < up.length; i++) if (fitsColumn(s, t, up[i])) {
        k = i;
        break;
      }
      if (k < 0) continue;
      const reveals = k === 0 && s.downN[c] > 0;
      const empties = k === 0 && s.downN[c] === 0;
      let order: number;
      if (k > 0) {
        // Splitting a run only helps when the card it uncovers goes up.
        if (!fitsFoundation(s, up[k - 1])) continue;
        order = 1;
      } else if (empty) {
        if (!reveals) continue; // a bare King from one empty column to another
        order = 2;
      } else if (reveals) order = 1;
      else if (empties) order = 4;
      else continue; // the same tops showing, just swapped
      const { ups, downN } = takeFromColumn(s, c, up.length - k);
      ups[t] = [...s.ups[t], ...up.slice(k)];
      moves.push({
        next: { ...s, ups, downN },
        tokens: [`${COL(c)}${COL(t)}`],
        order: order === 1 ? 1 - s.downN[c] / 10 : order,
      });
    }
  }
  // Talon cards that some taps of the stock bring up.
  for (const { index, taps } of reachable(s.talon.length, s.p)) {
    const card = s.talon[index];
    const talon = s.talon.slice();
    talon.splice(index, 1);
    const draws = Array<string>(taps).fill("s");
    if (fitsFoundation(s, card)) {
      moves.push({ next: { ...s, talon, p: index, found: toFoundation(s, card) }, tokens: [...draws, `w${FND(card)}`], order: 0.5 });
    }
    for (let t = 0; t < 7; t++) {
      if (!fitsColumn(s, t, card)) continue;
      const empty = s.ups[t].length === 0;
      if (empty && t !== emptyTarget) continue;
      const ups = s.ups.slice();
      ups[t] = [...s.ups[t], card];
      moves.push({ next: { ...s, talon, p: index, ups }, tokens: [...draws, `w${COL(t)}`], order: empty ? 2.5 : 2 + taps / 100 });
    }
  }
  return moves.sort((a, b) => a.order - b.order);
}

/** Safe cards played up, repeatedly: the state after, and the tokens that did it. */
function autoplay(s: State): { s: State; tokens: string[] } {
  const tokens: string[] = [];
  for (let again = true; again; ) {
    again = false;
    for (let c = 0; c < 7; c++) {
      const up = s.ups[c];
      if (up.length === 0) continue;
      const card = up[up.length - 1];
      if (fitsFoundation(s, card) && safeUp(s, card)) {
        const { ups, downN } = takeFromColumn(s, c, 1);
        s = { ...s, ups, downN, found: toFoundation(s, card) };
        tokens.push(`${COL(c)}${FND(card)}`);
        again = true;
      }
    }
    if (s.p > 0) {
      const card = s.talon[s.p - 1];
      if (fitsFoundation(s, card) && safeUp(s, card)) {
        const talon = s.talon.slice();
        talon.splice(s.p - 1, 1);
        s = { ...s, talon, p: s.p - 1, found: toFoundation(s, card) };
        tokens.push(`w${FND(card)}`);
        again = true;
      }
    }
  }
  return { s, tokens };
}

/** With the talon gone and every card face up, the rest goes up lowest first. */
function finishTokens(s: State): string[] | null {
  if (s.talon.length > 0 || s.downN.some((n) => n > 0)) return null;
  const tokens: string[] = [];
  const ups = s.ups.map((u) => u.slice());
  for (;;) {
    let best = -1;
    for (let c = 0; c < 7; c++) {
      if (ups[c].length && (best < 0 || RANK[ups[c][ups[c].length - 1]] < RANK[ups[best][ups[best].length - 1]])) best = c;
    }
    if (best < 0) return tokens;
    tokens.push(`${COL(best)}${FND(ups[best].pop()!)}`);
  }
}

const ch = (n: number) => String.fromCharCode(48 + n);

/** The visited key: column order doesn't change what can be won, so the columns are sorted. */
function keyOf(s: State): string {
  const cols: string[] = [];
  for (let c = 0; c < 7; c++) {
    let k = s.downN[c] ? ch(s.downs[c][0]) + ch(s.downN[c]) : "";
    k += ":";
    for (const card of s.ups[c]) k += ch(card);
    cols.push(k);
  }
  cols.sort();
  let talon = "";
  for (const card of s.talon) talon += ch(card);
  return `${s.found.map(ch).join("")}${ch(s.p)}${talon}|${cols.join(",")}`;
}

class OutOfBudget extends Error {}

/**
 * Searches for a win from `table`, giving up after `maxNodes` positions (or at `deadline`, a
 * performance.now() time, for the Hint button). The same table and budget always give the same
 * answer.
 */
export function solve(table: Table, opts: { maxNodes: number; deadline?: number }): SolveResult {
  const visited = new Set<string>();
  const path: string[] = [];
  let nodes = 0;

  const dfs = (start: State): boolean => {
    if (++nodes > opts.maxNodes) throw new OutOfBudget();
    if (opts.deadline !== undefined && (nodes & 255) === 0 && performance.now() > opts.deadline) throw new OutOfBudget();
    const { s, tokens } = autoplay(start);
    const mark = path.length;
    path.push(...tokens);
    const finish = finishTokens(s);
    if (finish) {
      path.push(...finish);
      return true;
    }
    const key = keyOf(s);
    if (!visited.has(key)) {
      visited.add(key);
      for (const move of generate(s)) {
        const before = path.length;
        path.push(...move.tokens);
        if (dfs(move.next)) return true;
        path.length = before;
      }
    }
    path.length = mark;
    return false;
  };

  try {
    return dfs(fromTable(table)) ? { status: "won", moves: path.slice(), nodes } : { status: "unknown", nodes };
  } catch (e) {
    if (e instanceof OutOfBudget) return { status: "unknown", nodes: Math.min(nodes, opts.maxNodes) };
    throw e;
  }
}
