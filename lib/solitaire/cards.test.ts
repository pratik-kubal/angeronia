import { describe, expect, it } from "vitest";
import { CARDS, cardCode, cardName, cardOf, isRed, rankLabel, rankOf, suitOf } from "./cards";

describe("cards", () => {
  it("has 52 cards with unique codes and names", () => {
    expect(new Set(CARDS.map(cardCode)).size).toBe(52);
    expect(new Set(CARDS.map(cardName)).size).toBe(52);
  });

  it("runs the suits ♥ ♠ ♦ ♣, alternating colour, Ace to King", () => {
    expect(cardCode(0)).toBe("AH");
    expect(cardCode(12)).toBe("KH");
    expect(cardCode(13)).toBe("AS");
    expect(cardCode(26 + 9)).toBe("TD");
    expect(cardCode(51)).toBe("KC");
    expect([0, 13, 26, 39].map(isRed)).toEqual([true, false, true, false]);
    expect(cardName(cardOf(1, 12))).toBe("Queen of spades");
    expect(rankLabel(cardOf(3, 10))).toBe("10");
  });

  it("round-trips suit and rank", () => {
    for (const card of CARDS) expect(cardOf(suitOf(card), rankOf(card))).toBe(card);
  });
});
