import { describe, expect, it } from "vitest";
import { TROPHIES } from "../../data/sudoku-trophies";
import { RARITIES, RARITY_ODDS, collect, drawTrophy, foundCount, trophyById, winCount, type Collection } from "./trophies";

describe("the trophy catalogue", () => {
  it("holds 100 trophies: 50 common, 25 uncommon, 15 rare, 7 epic and 3 legendary", () => {
    expect(TROPHIES).toHaveLength(100);
    const counts = Object.fromEntries(RARITIES.map((r) => [r, TROPHIES.filter((t) => t.rarity === r).length]));
    expect(counts).toEqual({ common: 50, uncommon: 25, rare: 15, epic: 7, legendary: 3 });
  });

  it("gives every trophy a unique id, name and emoji, and short copy", () => {
    for (const key of ["id", "name", "emoji"] as const) expect(new Set(TROPHIES.map((t) => t[key])).size).toBe(100);
    for (const t of TROPHIES) {
      expect(t.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(t.name.length).toBeLessThanOrEqual(22);
      expect(t.blurb.length).toBeLessThanOrEqual(60);
      expect(t.blurb).toMatch(/\.$/);
      // One emoji: a single grapheme.
      expect([...new Intl.Segmenter("en", { granularity: "grapheme" }).segment(t.emoji)]).toHaveLength(1);
    }
  });
});

describe("drawTrophy", () => {
  it("is the same trophy for the same seed and collection", () => {
    expect(drawTrophy(42, {})).toEqual(drawTrophy(42, {}));
  });

  it("draws rarities at their odds", () => {
    const n = 20000;
    const seen: Record<string, number> = {};
    for (let seed = 0; seed < n; seed++) {
      const r = drawTrophy(seed, {}).rarity;
      seen[r] = (seen[r] ?? 0) + 1;
    }
    for (const r of RARITIES) expect(Math.abs((seen[r] / n) * 100 - RARITY_ODDS[r])).toBeLessThan(1.5);
  });

  it("prefers trophies not found yet, and repeats once a rarity is complete", () => {
    let collection: Collection = {};
    const commons = TROPHIES.filter((t) => t.rarity === "common");
    for (let seed = 0; foundCount(collection) < 100 && seed < 100000; seed++) {
      const t = drawTrophy(seed, collection);
      const missing = TROPHIES.filter((x) => x.rarity === t.rarity && !collection[x.id]);
      if (missing.length) expect(collection[t.id]).toBeUndefined();
      collection = collect(collection, t.id);
    }
    expect(foundCount(collection)).toBe(100);
    expect(commons.every((t) => collection[t.id] >= 1)).toBe(true);
  });

  it("finds trophies by id", () => {
    expect(trophyById(TROPHIES[0].id)).toBe(TROPHIES[0]);
    expect(trophyById("no-such-thing")).toBeUndefined();
  });
});

describe("winCount", () => {
  it("counts every board won, a trophy found twice twice", () => {
    expect(winCount({})).toBe(0);
    expect(winCount({ [TROPHIES[0].id]: 2, [TROPHIES[1].id]: 1 })).toBe(3);
  });
});
