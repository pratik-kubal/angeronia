// Klondike's deal, seeded: the same seed always lays out the same table, so a game is its seed
// plus the moves made (game.ts) and the deal bank (deals.ts) is a list of seeds. Bump DEAL_VERSION
// whenever the shuffle or the layout changes: every banked seed and saved game is void after it.

import { mulberry32, shuffle } from "../random";
import { CARDS, type Card } from "./cards";

export const DEAL_VERSION = 1;

/** A tableau column, bottom card first: the face-down cards, then the face-up run on top. */
export type Column = { down: Card[]; up: Card[] };

export type Table = {
  /** The last card is the next one drawn. */
  stock: Card[];
  /** The last card is the playable top. */
  waste: Card[];
  /** How many cards of the latest draw are still on top of the waste (0–3), shown fanned. */
  fan: number;
  /** One per suit, in suit order (♥ ♠ ♦ ♣), Ace first. */
  foundations: Card[][];
  tableau: Column[];
};

/** The deck shuffled by `seed` (Fisher–Yates). */
export const shuffled = (seed: number): Card[] => shuffle(CARDS.slice(), mulberry32(seed));

/** Deals row by row, as by hand: columns of 1 to 7 cards, each top card face up; 24 left in the stock. */
export function deal(seed: number): Table {
  const deck = shuffled(seed);
  const cols: Card[][] = Array.from({ length: 7 }, () => []);
  let k = 0;
  for (let row = 0; row < 7; row++) for (let c = row; c < 7; c++) cols[c].push(deck[k++]);
  return {
    stock: deck.slice(k),
    waste: [],
    fan: 0,
    foundations: [[], [], [], []],
    tableau: cols.map((cards) => ({ down: cards.slice(0, -1), up: cards.slice(-1) })),
  };
}
