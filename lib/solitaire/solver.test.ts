import { describe, expect, it } from "vitest";
import { deal } from "./deal";
import { newGame, reduce, replay, type GameState } from "./game";
import { solve } from "./solver";

describe("solve", () => {
  it("returns only wins that replay, move by move, to a won game", () => {
    let won = 0;
    for (let seed = 1; seed <= 20; seed++) {
      const result = solve(deal(seed), { maxNodes: 20_000 });
      if (result.status !== "won") continue;
      won++;
      const { state, applied } = replay(seed, result.moves);
      expect(applied, `seed ${seed}`).toBe(result.moves.length);
      expect(state.status, `seed ${seed}`).toBe("won");
    }
    // Most random deals can be won (about four in five); the budgeted search finds most of those.
    expect(won).toBeGreaterThanOrEqual(10);
  });

  it("gives the same answer every time", () => {
    const a = solve(deal(3), { maxNodes: 20_000 });
    const b = solve(deal(3), { maxNodes: 20_000 });
    expect(b).toEqual(a);
  });

  it("says only 'unknown' when it runs out of budget", () => {
    expect(solve(deal(1), { maxNodes: 1 })).toEqual({ status: "unknown", nodes: 1 });
    expect(solve(deal(1), { maxNodes: 1e9, deadline: performance.now() - 1 }).status).toMatch(/won|unknown/);
  });

  it("solves from the middle of a game, as the Hint button asks", () => {
    const seed = 2;
    const full = solve(deal(seed), { maxNodes: 50_000 });
    expect(full.status).toBe("won");
    if (full.status !== "won") return;
    // Ten of its moves in, the game is still winnable from there.
    let s: GameState = newGame(seed);
    for (const token of full.moves.slice(0, 10)) s = replay(seed, [...s.log, token]).state;
    const rest = solve(s.table, { maxNodes: 50_000 });
    expect(rest.status).toBe("won");
    if (rest.status !== "won") return;
    expect(replay(seed, [...s.log, ...rest.moves]).state.status).toBe("won");
  });

  it("finishes a table with every card face up and the talon gone without searching", () => {
    let s = newGame(5);
    const t = s.table;
    // Everything face up in columns of descending runs: put each suit's cards in reverse order on its own column.
    const columns = [0, 1, 2, 3].map((suit) => Array.from({ length: 13 }, (_, k) => suit * 13 + 12 - k));
    s = { ...s, table: { ...t, stock: [], waste: [], tableau: t.tableau.map((_, i) => ({ down: [], up: columns[i] ?? [] })) } };
    const result = solve(s.table, { maxNodes: 10 });
    expect(result.status).toBe("won");
    if (result.status !== "won") return;
    let g = s;
    for (const token of result.moves) {
      const parsed = token === "s" ? null : token;
      expect(parsed).not.toBeNull();
      const [from, to] = [token.slice(0, 2), token.slice(2)] as const;
      g = reduce(g, { type: "move", from: from as never, to: to as never, count: 1 });
    }
    expect(g.status).toBe("won");
  });
});
