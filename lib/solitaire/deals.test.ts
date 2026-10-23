import { describe, expect, it } from "vitest";
import { DEAL_VERSION, deal } from "./deal";
import { BANK_BUDGET, BANK_DEAL_VERSION, DEALS } from "./deals";
import { replay } from "./game";
import { solve } from "./solver";

// The bank (lib/solitaire/deals.ts, from `pnpm solitaire:deals`) holds only winnable deals: the
// script replays each solution through the reducer before keeping a seed. Here a few are proven
// again, so a change to the deal or the rules that voids the bank fails loudly.

describe("the deal bank", () => {
  it("was proven under the current deal", () => {
    expect(BANK_DEAL_VERSION).toBe(DEAL_VERSION);
  });

  it("holds at least 1,000 distinct positive seeds", () => {
    expect(DEALS.length).toBeGreaterThanOrEqual(1000);
    expect(new Set(DEALS).size).toBe(DEALS.length);
    for (const seed of DEALS) expect(Number.isInteger(seed) && seed > 0).toBe(true);
  });

  it("proves a sample again: each solved within the bank's budget and replayed to a win", { timeout: 60_000 }, () => {
    const sample = [0, 1, 99, 250, 500, 750, 998, DEALS.length - 1].map((i) => DEALS[i]);
    for (const seed of sample) {
      const result = solve(deal(seed), { maxNodes: BANK_BUDGET });
      expect(result.status, `seed ${seed}`).toBe("won");
      if (result.status !== "won") continue;
      expect(replay(seed, result.moves).state.status, `seed ${seed}`).toBe("won");
    }
  });
});
