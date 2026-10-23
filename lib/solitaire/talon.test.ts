import { describe, expect, it } from "vitest";
import type { Table } from "./deal";
import { newGame, reduce, type GameState } from "./game";
import { reachable } from "./talon";

/** A game whose talon is T = [0, 1, … n − 1] with p cards on the waste. */
function talon(n: number, p: number): GameState {
  const T = Array.from({ length: n }, (_, i) => i);
  const table: Table = {
    stock: T.slice(p).reverse(),
    waste: T.slice(0, p),
    fan: 0,
    foundations: [[], [], [], []],
    tableau: Array.from({ length: 7 }, () => ({ down: [], up: [] })),
  };
  return { ...newGame(1), table };
}

const sequence = (t: Table) => [...t.waste, ...t.stock.slice().reverse()];

describe("reachable", () => {
  it("matches tapping the real stock, for every talon size and waste size", () => {
    for (let n = 0; n <= 24; n++) {
      for (let p = 0; p <= n; p++) {
        // Brute force: tap until the cycle repeats, noting the first tap that shows each top.
        const seen = new Map<number, number>();
        let s = talon(n, p);
        for (let taps = 0; taps <= 2 * n + 2; taps++) {
          const top = s.table.waste.at(-1);
          if (top !== undefined && !seen.has(top)) seen.set(top, taps);
          s = reduce(s, { type: "stock" });
        }
        const brute = [...seen].map(([index, taps]) => ({ index, taps }));
        const sort = (a: { index: number; taps: number }[]) => a.slice().sort((x, y) => x.index - y.index);
        expect(sort(reachable(n, p)), `n=${n} p=${p}`).toEqual(sort(brute));
      }
    }
  });

  it("leaves the talon without the card and the waste at its index, however the taps went", () => {
    for (const [n, p] of [[24, 0], [17, 5], [10, 10], [7, 3]]) {
      for (const { index, taps } of reachable(n, p)) {
        let s = talon(n, p);
        for (let k = 0; k < taps; k++) s = reduce(s, { type: "stock" });
        expect(s.table.waste.at(-1)).toBe(index);
        const taken: Table = { ...s.table, waste: s.table.waste.slice(0, -1) };
        expect(taken.waste).toHaveLength(index);
        expect(sequence(taken)).toEqual(sequence(talon(n, p).table).filter((c) => c !== index));
      }
    }
  });

  it("puts the fewest taps first", () => {
    const r = reachable(24, 0);
    expect(r[0]).toEqual({ index: 2, taps: 1 });
    expect(r.map((x) => x.taps)).toEqual(r.map((x) => x.taps).slice().sort((a, b) => a - b));
  });
});
