// The Hint button. When the solver finds a win from where the player is (within a few dozen
// milliseconds), the hint is its next move, so a player who follows hints wins. Otherwise, or
// after it, come the moves that help by rule of thumb: cards up to the foundations, moves that
// turn a card over, waste cards onto the table, then the stock. Pressing Hint again shows the
// next one. Loaded on the first press (the solver stays out of the page's first load).

import { suitOf } from "./cards";
import type { Table } from "./deal";
import { FOUNDATION_IDS, TABLEAU_IDS, fitsFoundation, legalCount, parseToken, type PileId } from "./game";
import { solve } from "./solver";

export type Hint = { kind: "stock" } | { kind: "move"; from: PileId; to: PileId; count: number };

const same = (a: Hint, b: Hint) =>
  a.kind === b.kind && (a.kind === "stock" || (b.kind === "move" && a.from === b.from && a.to === b.to));

/** The helpful moves on the table, most helpful first (no swaps that change nothing). */
export function usefulMoves(table: Table): Hint[] {
  const up: Hint[] = [];
  const reveal: { hint: Hint; down: number }[] = [];
  const fromWaste: Hint[] = [];
  const waste = table.waste[table.waste.length - 1];
  if (waste !== undefined) {
    const f = FOUNDATION_IDS[suitOf(waste)];
    if (legalCount(table, "w", f)) up.push({ kind: "move", from: "w", to: f, count: 1 });
  }
  TABLEAU_IDS.forEach((from, c) => {
    const col = table.tableau[c];
    const top = col.up[col.up.length - 1];
    if (top === undefined) return;
    const f = FOUNDATION_IDS[suitOf(top)];
    if (legalCount(table, from, f)) up.push({ kind: "move", from, to: f, count: 1 });
    for (const to of TABLEAU_IDS) {
      const count = legalCount(table, from, to);
      if (count === null) continue;
      const whole = count === col.up.length;
      // A whole run moved off face-down cards turns one over; a split run helps only if the card it
      // uncovers goes up. Anything else (a bare King between empty columns, a run moved from one
      // matching card to another) changes nothing.
      const uncovered = col.up[col.up.length - count - 1];
      if (whole && col.down.length > 0) reveal.push({ hint: { kind: "move", from, to, count }, down: col.down.length });
      else if (!whole && fitsFoundation(table, uncovered, suitOf(uncovered))) reveal.push({ hint: { kind: "move", from, to, count }, down: 0 });
    }
  });
  if (waste !== undefined) {
    for (const to of TABLEAU_IDS) if (legalCount(table, "w", to)) fromWaste.push({ kind: "move", from: "w", to, count: 1 });
  }
  const stock: Hint[] = table.stock.length || table.waste.length ? [{ kind: "stock" }] : [];
  return [...up, ...reveal.sort((a, b) => b.down - a.down).map((r) => r.hint), ...fromWaste, ...stock];
}

/** The solver's next move from `table`, if it finds a win in time. */
export function solverHint(table: Table, opts: { maxNodes: number; deadline?: number }): Hint | null {
  const result = solve(table, opts);
  if (result.status !== "won" || result.moves.length === 0) return null;
  const token = result.moves[0];
  if (token === "s") return { kind: "stock" };
  const move = parseToken(token)!;
  const count = legalCount(table, move.from, move.to);
  return count === null ? null : { kind: "move", ...move, count };
}

/** Every hint for the table, in the order presses cycle through them; empty when nothing helps. */
export function hintList(table: Table, opts: { maxNodes?: number; deadline?: number } = {}): Hint[] {
  const useful = usefulMoves(table);
  const best = solverHint(table, { maxNodes: opts.maxNodes ?? 30_000, deadline: opts.deadline });
  return best ? [best, ...useful.filter((h) => !same(h, best))] : useful;
}
