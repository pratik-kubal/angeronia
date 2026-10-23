import { describe, expect, it } from "vitest";
import { CARDS, cardCode, type Card } from "./cards";
import { deal, type Table } from "./deal";
import { legalCount } from "./game";
import { hintList, solverHint, usefulMoves } from "./hint";

const CODES = new Map(CARDS.map((c) => [cardCode(c), c]));
const cards = (codes: string): Card[] => (codes ? codes.split(" ").map((c) => CODES.get(c)!) : []);
function table(stock: string, waste: string, foundations: string[], cols: [string, string][]): Table {
  return {
    stock: cards(stock),
    waste: cards(waste),
    fan: 0,
    foundations: foundations.map(cards),
    tableau: Array.from({ length: 7 }, (_, i) => ({ down: cards(cols[i]?.[0] ?? ""), up: cards(cols[i]?.[1] ?? "") })),
  };
}

describe("usefulMoves", () => {
  it("puts cards up first, then moves that turn a card over (most face-down first), then the waste, then the stock", () => {
    const t = table("5S", "AD 6D", ["AH", "", "", ""], [["", "2H"], ["4C", "7C"], ["4S 5C 9H", "7S"], ["", "8H"], ["", ""], ["", ""], ["", ""]]);
    expect(usefulMoves(t)).toEqual([
      { kind: "move", from: "t0", to: "f0", count: 1 },
      { kind: "move", from: "t2", to: "t3", count: 1 },
      { kind: "move", from: "t1", to: "t3", count: 1 },
      { kind: "move", from: "w", to: "t1", count: 1 },
      { kind: "move", from: "w", to: "t2", count: 1 },
      { kind: "stock" },
    ]);
  });

  it("never offers a swap that changes nothing", () => {
    // 7H on an 8S could move to the other black 8, and the bare King to the empty column: both pointless.
    const t = table("", "", ["", "", "", ""], [["", "8S 7H"], ["", "8C"], ["", "KD"], ["", ""]]);
    expect(usefulMoves(t)).toEqual([]);
  });

  it("offers a split run when the card it uncovers goes up", () => {
    // 3H off the 4S onto the 4C uncovers the 4S, which goes up on the 3S.
    const t = table("", "", ["", "AS 2S 3S", "", ""], [["", "4S 3H"], ["", "4C"]]);
    expect(usefulMoves(t)).toContainEqual({ kind: "move", from: "t0", to: "t1", count: 1 });
  });
});

describe("hintList", () => {
  it("leads with the solver's move when it finds a win, and every hint is legal", () => {
    const t = deal(2);
    const best = solverHint(t, { maxNodes: 30_000 });
    expect(best).not.toBeNull();
    const list = hintList(t);
    expect(list[0]).toEqual(best);
    for (const h of list) if (h.kind === "move") expect(legalCount(t, h.from, h.to)).toBe(h.count);
    expect(new Set(list.map((h) => JSON.stringify(h))).size).toBe(list.length);
  });

  it("is empty on a table where nothing helps", () => {
    const t = table("", "", ["", "", "", ""], [["", "8S 7H"], ["", "8C"]]);
    expect(hintList(t, { maxNodes: 1000 })).toEqual([]);
  });
});
