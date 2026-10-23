import { afterEach, describe, expect, it, vi } from "vitest";
import { DEALS } from "@/lib/solitaire/deals";
import { newGame, reduce } from "@/lib/solitaire/game";
import { NO_STATS, dealOrder, loadGame, loadStats, saveGame, takeDeal, takeFx, withLoss, withPlayed, withWin } from "./storage";

/** A localStorage stub; "throw" makes every access throw (blocked storage). */
function storage(mode: "ok" | "throw" = "ok") {
  const store = new Map<string, string>();
  const guard = () => {
    if (mode === "throw") throw new Error("blocked");
  };
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => (guard(), store.get(k) ?? null),
    setItem: (k: string, v: string) => (guard(), store.set(k, v)),
  });
  return store;
}

afterEach(() => vi.unstubAllGlobals());

describe("the saved game", () => {
  it("round-trips the game in progress", () => {
    storage();
    const s = reduce(newGame(DEALS[0]), { type: "stock" });
    saveGame(s);
    expect(loadGame()!.table).toEqual(s.table);
  });

  it("is null when blocked or junk", () => {
    storage("throw");
    expect(loadGame()).toBeNull();
    saveGame(newGame(1));
    const store = storage();
    store.set("solitaire:game", "{");
    expect(loadGame()).toBeNull();
  });
});

describe("statistics", () => {
  it("counts plays, wins, streaks and bests", () => {
    let s = withWin(withPlayed(NO_STATS), 90_000, 4000);
    s = withWin(withPlayed(s), 60_000, 3000);
    expect(s).toEqual({ played: 2, won: 2, streak: 2, bestStreak: 2, bestTime: 60_000, bestScore: 4000 });
    s = withLoss(withPlayed(s));
    expect(s).toMatchObject({ played: 3, won: 2, streak: 0, bestStreak: 2 });
  });

  it("reads junk back clean", () => {
    const store = storage();
    store.set("solitaire:stats", JSON.stringify({ played: -3, won: 2, streak: "x", bestStreak: 1, bestTime: "slow", bestScore: 5 }));
    expect(loadStats()).toEqual({ played: 2, won: 2, streak: 0, bestStreak: 1, bestTime: null, bestScore: 5 });
    store.set("solitaire:stats", "null");
    expect(loadStats()).toEqual(NO_STATS);
  });
});

describe("the deal bank", () => {
  it("orders every deal once per salt", () => {
    const order = dealOrder(42, DEALS.length);
    expect(new Set(order).size).toBe(DEALS.length);
    expect(dealOrder(42, DEALS.length)).toEqual(order);
    expect(dealOrder(43, DEALS.length)).not.toEqual(order);
  });

  it("deals every banked seed before any comes round again", () => {
    storage();
    const seen = new Set<number>();
    for (let k = 0; k < DEALS.length; k++) seen.add(takeDeal());
    expect(seen.size).toBe(DEALS.length);
    for (const seed of seen) expect(DEALS).toContain(seed);
    expect(DEALS).toContain(takeDeal());
  });

  it("still deals from the bank with storage blocked", () => {
    storage("throw");
    expect(DEALS).toContain(takeDeal());
  });
});

describe("the win animation", () => {
  it("cycles 0, 1, 2, 3 and round again", () => {
    storage();
    expect(Array.from({ length: 6 }, () => takeFx(4))).toEqual([0, 1, 2, 3, 0, 1]);
  });

  it("starts at the first with junk or blocked storage", () => {
    const store = storage();
    store.set("solitaire:fx", '"x"');
    expect(takeFx(4)).toBe(0);
    storage("throw");
    expect(takeFx(4)).toBe(0);
  });
});
