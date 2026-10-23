// Trophies: every solved board wins one of the 100 collectibles in data/sudoku-trophies.ts. The
// draw is seeded by the game, so the same board and collection always win the same trophy.

import { TROPHIES, type Trophy } from "../../data/sudoku-trophies";
import { mulberry32 } from "../random";

export type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

/** Rarest first, the order the collection shows them in. */
export const RARITIES: readonly Rarity[] = ["legendary", "epic", "rare", "uncommon", "common"];

/** The chance (in percent) a solved board wins each rarity. */
export const RARITY_ODDS: Record<Rarity, number> = { common: 52, uncommon: 26, rare: 14, epic: 6, legendary: 2 };

/** How many of each trophy the player has found, by id. */
export type Collection = Record<string, number>;

export const trophyById = (id: string): Trophy | undefined => TROPHIES.find((t) => t.id === id);

/** How many different trophies the collection holds. */
export const foundCount = (collection: Collection) => TROPHIES.filter((t) => collection[t.id]).length;

/** Boards won so far: every win draws one trophy, so a trophy found twice counts twice. */
export const winCount = (collection: Collection) => Object.values(collection).reduce((sum, n) => sum + n, 0);

/**
 * The trophy a solved board wins: a rarity by RARITY_ODDS, then one of that rarity the player has
 * not found yet (any of it, once all are found), so the collection keeps growing.
 */
export function drawTrophy(seed: number, collection: Collection): Trophy {
  const rng = mulberry32(seed ^ 0x5bd1e995);
  let roll = rng() * 100;
  let rarity: Rarity = "common";
  for (const r of [...RARITIES].reverse()) {
    roll -= RARITY_ODDS[r];
    if (roll < 0) {
      rarity = r;
      break;
    }
  }
  const pool = TROPHIES.filter((t) => t.rarity === rarity);
  const missing = pool.filter((t) => !collection[t.id]);
  const from = missing.length ? missing : pool;
  return from[Math.floor(rng() * from.length)];
}

/** The collection with one more of the trophy. */
export const collect = (collection: Collection, id: string): Collection => ({ ...collection, [id]: (collection[id] ?? 0) + 1 });
