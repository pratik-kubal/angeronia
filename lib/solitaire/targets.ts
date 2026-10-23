// Where a tapped card goes. A tap moves the card (and the run on it) to the best legal place:
// its foundation when it can go up, else the first column it fits, looking on from its own
// column (non-empty columns first; an empty one only takes a King that comes from the waste or
// uncovers a card). Cards never come down from a foundation by tap (it costs 15 points), only by
// drag.

import { rankOf, suitOf } from "./cards";
import type { Table } from "./deal";
import { FOUNDATION_IDS, TABLEAU_IDS, isEmptyColumn, legalCount, pileCards, type PileId } from "./game";

/** The run a press on card `index` of a pile (bottom first, face-down cards included) would move. */
export function runAt(table: Table, pile: PileId, index: number): { from: PileId; count: number } | null {
  if (pile === "s") return null;
  const cards = pileCards(table, pile);
  if (index < 0 || index >= cards.length) return null;
  if (pile === "w" || pile[0] === "f") return index === cards.length - 1 ? { from: pile, count: 1 } : null;
  const col = table.tableau[Number(pile[1])];
  return index >= col.down.length ? { from: pile, count: cards.length - index } : null;
}

/** The pile a tap sends `count` cards from `from` to, or null when there's nowhere useful. */
export function bestTarget(table: Table, from: PileId, count: number): PileId | null {
  if (from === "s" || from[0] === "f") return null;
  const cards = pileCards(table, from);
  const moving = cards[cards.length - count];
  if (moving === undefined) return null;
  if (count === 1) {
    const f = FOUNDATION_IDS[suitOf(moving)];
    if (legalCount(table, from, f) === 1) return f;
  }
  const start = from === "w" ? 0 : Number(from[1]) + 1;
  const order = TABLEAU_IDS.map((_, k) => TABLEAU_IDS[(start + k) % 7]).filter((t) => t !== from);
  const fits = order.filter((t) => legalCount(table, from, t) === count);
  const filled = fits.find((t) => !isEmptyColumn(table.tableau[Number(t[1])]));
  if (filled) return filled;
  const empty = fits[0];
  if (empty === undefined || rankOf(moving) !== 13) return null;
  const uncovers = from === "w" || table.tableau[Number(from[1])].down.length > 0;
  return uncovers ? empty : null;
}

/** Which pile a card is in, and where (bottom first, face-down cards included). */
export function locate(table: Table, card: number): { pile: PileId; index: number } | null {
  const piles: PileId[] = ["s", "w", ...FOUNDATION_IDS, ...TABLEAU_IDS];
  for (const pile of piles) {
    const index = pileCards(table, pile).indexOf(card);
    if (index >= 0) return { pile, index };
  }
  return null;
}
