import { describe, expect, it } from "vitest";
import { cardCode } from "./cards";
import { deal, shuffled } from "./deal";

describe("deal", () => {
  it("is the same table for the same seed", () => {
    expect(deal(7)).toEqual(deal(7));
    expect(deal(7)).not.toEqual(deal(8));
  });

  it("pins seed 1's layout (a change voids every banked seed: bump DEAL_VERSION)", () => {
    const t = deal(1);
    expect(t.tableau.map((c) => c.up.map(cardCode).join(""))).toMatchInlineSnapshot(`
      [
        "QS",
        "3C",
        "9D",
        "9H",
        "7C",
        "8H",
        "4S",
      ]
    `);
    expect(t.stock.slice(-3).map(cardCode).join(" ")).toMatchInlineSnapshot(`"AD AH 7D"`);
  });

  it("lays columns of 1 to 7 cards, each top card face up, and 24 in the stock", () => {
    for (const seed of [1, 2, 99, 123456]) {
      const t = deal(seed);
      expect(t.tableau.map((c) => c.down.length)).toEqual([0, 1, 2, 3, 4, 5, 6]);
      expect(t.tableau.every((c) => c.up.length === 1)).toBe(true);
      expect(t.stock).toHaveLength(24);
      expect(t.waste).toEqual([]);
      expect(t.foundations).toEqual([[], [], [], []]);
      const all = [...t.stock, ...t.tableau.flatMap((c) => [...c.down, ...c.up])];
      expect(new Set(all).size).toBe(52);
    }
  });

  it("deals row by row from the shuffled deck", () => {
    const deck = shuffled(5);
    const t = deal(5);
    expect(t.tableau[0].up[0]).toBe(deck[0]);
    expect(t.tableau[6].down[0]).toBe(deck[6]);
    expect(t.tableau[1].up[0]).toBe(deck[7]);
    expect(t.tableau[6].up[0]).toBe(deck[27]);
    expect(t.stock).toEqual(deck.slice(28));
  });
});
