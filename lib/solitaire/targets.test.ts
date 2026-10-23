import { describe, expect, it } from "vitest";
import { CARDS, cardCode, type Card } from "./cards";
import { deal, type Table } from "./deal";
import { PILE_IDS, pileCards } from "./game";
import { bestTarget, locate, runAt } from "./targets";

const CODES = new Map(CARDS.map((c) => [cardCode(c), c]));
const cards = (codes: string): Card[] => (codes ? codes.split(" ").map((c) => CODES.get(c)!) : []);
function table(waste: string, foundations: string[], cols: [string, string][]): Table {
  return {
    stock: [],
    waste: cards(waste),
    fan: 0,
    foundations: foundations.map(cards),
    tableau: Array.from({ length: 7 }, (_, i) => ({ down: cards(cols[i]?.[0] ?? ""), up: cards(cols[i]?.[1] ?? "") })),
  };
}

describe("runAt", () => {
  const t = table("4C 9D", ["AH", "", "", ""], [["2C 3S", "8S 7H 6C"], ["", ""]]);
  it("moves the pressed face-up card and everything on it", () => {
    expect(runAt(t, "t0", 2)).toEqual({ from: "t0", count: 3 });
    expect(runAt(t, "t0", 4)).toEqual({ from: "t0", count: 1 });
  });
  it("ignores face-down cards, cards under the waste top and the stock", () => {
    expect(runAt(t, "t0", 1)).toBeNull();
    expect(runAt(t, "w", 0)).toBeNull();
    expect(runAt(t, "w", 1)).toEqual({ from: "w", count: 1 });
    expect(runAt(t, "s", 0)).toBeNull();
    expect(runAt(t, "f0", 0)).toEqual({ from: "f0", count: 1 });
  });
});

describe("bestTarget", () => {
  it("sends a card up to its foundation first", () => {
    const t = table("2H", ["AH", "", "", ""], [["", "3S"]]);
    expect(bestTarget(t, "w", 1)).toBe("f0");
  });

  it("else to the first column it fits, looking on from its own", () => {
    const t = table("", ["", "", "", ""], [["", "8S"], ["", "8C"], ["", "7H"], ["", ""], ["", "8C"], ["", ""], ["", ""]]);
    expect(bestTarget(t, "t2", 1)).toBe("t4");
    const t2 = table("7D", ["", "", "", ""], [["", "8S"], ["", "8C"]]);
    expect(bestTarget(t2, "w", 1)).toBe("t0");
  });

  it("takes a King to an empty column only from the waste or off face-down cards", () => {
    const t = table("KD", ["", "", "", ""], [["", "KS"], ["4C", "KH QS"], ["", ""]]);
    expect(bestTarget(t, "w", 1)).toBe("t2");
    expect(bestTarget(t, "t1", 2)).toBe("t2");
    expect(bestTarget(t, "t0", 1)).toBeNull();
  });

  it("never taps a card down from a foundation", () => {
    const t = table("", ["AH 2H 3H 4H 5H 6H 7H", "", "", ""], [["", "8S"]]);
    expect(bestTarget(t, "f0", 1)).toBeNull();
  });

  it("returns null when nothing fits", () => {
    const t = table("5D", ["", "", "", ""], [["", "9S"]]);
    expect(bestTarget(t, "w", 1)).toBeNull();
  });
});

describe("locate", () => {
  it("finds every card's pile and place", () => {
    const t = deal(8);
    for (const pile of PILE_IDS) pileCards(t, pile).forEach((card, index) => expect(locate(t, card)).toEqual({ pile, index }));
  });
});
