import { describe, expect, it } from "vitest";
import { newGame, reduce, type GameState, type Move } from "../game";
import { ALL, PEERS, UNITS, boxOf } from "../grid";
import { RECENT_MOVES, secretsAt, type Moment, type SecretContext } from ".";

// Aurora's secrets, all on nine and on ones: each met by its own moment and missed by the near
// misses around it. Aurora has no season, so an ordinary September afternoon is the default.

/** A local time on an ordinary September day. */
const at = (hour: number, minute: number, second = 30) => new Date(2026, 8, 16, hour, minute, second);
const AFTERNOON = at(14, 7);

const met = (moment: Moment, recent: readonly Move[] = [], now = AFTERNOON) =>
  secretsAt("aurora", { moment, now, recent } satisfies SecretContext).map((s) => s.id);

/** Empty cells for 1 to 9, each in a box of its own (found by backtracking). */
function spread(state: GameState): number[] {
  const cells: number[] = [];
  const boxes = new Set<number>();
  const fill = (digit: number): boolean => {
    if (digit > 9) return true;
    for (let i = 0; i < 81; i++) {
      if (state.grid[i] || state.solution[i] !== digit || boxes.has(boxOf(i))) continue;
      cells.push(i);
      boxes.add(boxOf(i));
      if (fill(digit + 1)) return true;
      cells.pop();
      boxes.delete(boxOf(i));
    }
    return false;
  };
  expect(fill(1), "a count across nine boxes").toBe(true);
  return cells;
}

/**
 * A hard game (24 clues, so every digit has empty cells left in most boxes) played step by step,
 * keeping this tab's moves. A count places each digit where a plan across the nine boxes puts it;
 * a new plan is made at each 1 (or when the planned cell is taken).
 */
function playing(seed = 4242) {
  let state: GameState = newGame("hard", seed);
  const moves: Move[] = [];
  let plan: number[] = [];
  const record = (): Moment => {
    moves.push(state.last!);
    return { kind: "move", state, move: state.last! };
  };
  const planned = (digit: number) => {
    if (digit === 1 || !plan.length || state.grid[plan[digit - 1]]) plan = spread(state);
    return plan[digit - 1];
  };
  const put = (cell: number, digit: number) => {
    state = reduce(reduce(state, { type: "select", cell }), { type: "digit", digit });
    expect(state.last).toMatchObject({ kind: "place", cell, digit });
    return record();
  };
  return {
    get state() {
      return state;
    },
    /** Places `digit` where the count across the boxes wants it. */
    count: (digit: number) => put(planned(digit), digit),
    /** Places `digit` in a box the last placed digits already used (the count's near miss). */
    crowd(digit: number): Moment {
      const used = new Set(moves.filter((m) => m.kind !== "miss").slice(-8).map((m) => boxOf(m.cell)));
      const cell = state.grid.findIndex((d, i) => !d && state.solution[i] === digit && used.has(boxOf(i)));
      expect(cell, `an empty cell for ${digit} in a box already used`).toBeGreaterThanOrEqual(0);
      return put(cell, digit);
    },
    /** Places `digit` anywhere it fits, outside the current plan. */
    place(digit: number): Moment {
      const cell = state.grid.findIndex((d, i) => !d && state.solution[i] === digit && !plan.includes(i));
      expect(cell, `an empty cell for ${digit}`).toBeGreaterThanOrEqual(0);
      return put(cell, digit);
    },
    /** Tries `digit` in an empty cell that doesn't take it (refused). */
    miss(digit: number): Moment {
      const cell = state.grid.findIndex((d, i) => !d && state.solution[i] !== digit);
      state = reduce(reduce(state, { type: "select", cell }), { type: "digit", digit });
      expect(state.last?.kind).toBe("miss");
      return record();
    },
    /** A hint in the cell the count wants for `digit`. */
    hint(digit: number): Moment {
      state = reduce(reduce(state, { type: "select", cell: planned(digit) }), { type: "hint" });
      expect(state.last).toMatchObject({ kind: "hint", digit });
      return record();
    },
    get recent() {
      return moves.slice(-RECENT_MOVES);
    },
  };
}

type Step = number | `${"miss" | "hint" | "any" | "crowd"}:${number}`;

/**
 * Plays the steps in order and lists what each move met: a number counts it (across the boxes),
 * "miss:d" tries d where it doesn't fit, "hint:d" takes a hint where the count wants d, "any:d"
 * places d anywhere, and "crowd:d" places d in a box the count already used.
 */
function count(steps: readonly Step[], seed?: number) {
  const game = playing(seed);
  const found = steps.map((step) => {
    const [how, d] = typeof step === "number" ? ["count", step] : [step.split(":")[0], Number(step.split(":")[1])];
    const moment = how === "count" ? game.count(d) : how === "miss" ? game.miss(d) : how === "hint" ? game.hint(d) : how === "any" ? game.place(d) : game.crowd(d);
    return met(moment, game.recent);
  });
  return { game, found };
}

const ONE_TO_NINE = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

describe("Star Trails", () => {
  it("is met by nine knocks on the title in a row, and every ninth after", () => {
    expect(met({ kind: "emblem", taps: 9 })).toEqual(["star-trails"]);
    expect(met({ kind: "emblem", taps: 18 })).toEqual(["star-trails"]);
    expect(met({ kind: "emblem", taps: 27 })).toEqual(["star-trails"]);
  });

  it("is not met by eight knocks, ten, one, or a tap on the scene", () => {
    for (const taps of [1, 2, 8, 10, 17]) expect(met({ kind: "emblem", taps }), `${taps} taps`).toEqual([]);
    expect(met({ kind: "scene", target: "mark" })).toEqual([]);
  });
});

describe("Your Constellation", () => {
  it("is met by placing 1 to 9 one after another, each in a box of its own, on the 9 alone", () => {
    const { game, found } = count(ONE_TO_NINE);
    expect(found.slice(0, 8).flat()).toEqual([]);
    expect(found[8]).toEqual(["constellation"]);
    expect(new Set(game.recent.map((m) => boxOf(m.cell))).size).toBe(9);
  });

  it("forgives a refused digit in the middle of the count (it counts for nothing)", () => {
    const { found } = count([1, 2, 3, 4, "miss:7", 5, 6, 7, 8, 9]);
    expect(found.slice(0, 9).flat()).toEqual([]);
    expect(found[9]).toEqual(["constellation"]);
  });

  it("counts a hint like a placed digit", () => {
    expect(count([1, 2, 3, 4, "hint:5", 6, 7, 8, 9]).found[8]).toEqual(["constellation"]);
  });

  it("is met when the count follows other digits, and again on a second count", () => {
    const { found } = count(["any:7", "any:7", "any:3", ...ONE_TO_NINE, ...ONE_TO_NINE]);
    expect(found.flat()).toEqual(["constellation", "constellation"]);
    expect(found[11]).toEqual(["constellation"]);
    expect(found[20]).toEqual(["constellation"]);
  });

  it("is not met one short, out of order, backwards or with a skip", () => {
    const misses: Step[][] = [
      [1, 2, 3, 4, 5, 6, 7, 8],
      [1, 2, 3, 4, 5, 6, 7, 8, 1],
      [1, 2, 3, 5, 4, 6, 7, 8, 9],
      [9, 8, 7, 6, 5, 4, 3, 2, 1],
      [2, 3, 4, 5, 6, 7, 8, 9, 1],
      [1, 2, 3, 4, 5, 6, 7, 9],
      [1, 1, 2, 3, 4, 5, 6, 7, 8],
    ];
    for (const steps of misses) expect(count(steps).found.flat(), steps.join(",")).toEqual([]);
  });

  it("is not met when two digits of the count share a box", () => {
    expect(count([1, 2, 3, 4, 5, 6, 7, 8, "crowd:9"]).found.flat()).toEqual([]);
    expect(count([1, 2, 3, 4, "crowd:5", 6, 7, 8, 9]).found.flat()).toEqual([]);
  });

  it("is not met by a refused 9 at the end of the count", () => {
    expect(count([1, 2, 3, 4, 5, 6, 7, 8, "miss:9"]).found.flat()).toEqual([]);
  });

  it("is not met again by a refused digit right after the count", () => {
    const { found } = count([...ONE_TO_NINE, "miss:4"]);
    expect(found[8]).toEqual(["constellation"]);
    expect(found[9]).toEqual([]);
  });

  it("is not met by a stale count: the moment's own move must be the 9", () => {
    const { game } = count(ONE_TO_NINE);
    const earlier = game.recent[3];
    expect(met({ kind: "move", state: game.state, move: earlier }, game.recent)).toEqual([]);
  });

  it("is never met by solving a board in reading order, or digit by digit", () => {
    for (const seed of [4242, 99, 2026]) {
      const dealt = newGame("hard", seed);
      const reading = dealt.grid.flatMap((d, i) => (d ? [] : [i]));
      // Digit by digit: every 1, then every 2, and so on.
      const byDigit = reading.slice().sort((a, b) => dealt.solution[a] - dealt.solution[b] || a - b);
      for (const cells of [reading, byDigit]) {
        let state = dealt;
        const moves: Move[] = [];
        for (const cell of cells) {
          state = reduce(reduce(state, { type: "select", cell }), { type: "digit", digit: state.solution[cell] });
          moves.push(state.last!);
          const recent = moves.slice(-RECENT_MOVES);
          expect(met({ kind: "move", state, move: state.last! }, recent)).not.toContain("constellation");
        }
        expect(state.status).toBe("won");
      }
    }
  });

  // The way of play the boxes are for: look for a 1 the board gives away (the only place for it in
  // a row, column or box), place it, then a 2, … a 9, and round again. It counts 1 to 9 in a row
  // on most of these boards, but never across nine boxes.
  it("is never met by a player who looks for one of each digit in turn", () => {
    const candidates = (grid: readonly number[], i: number) => PEERS[i].reduce((m, p) => m & ~(1 << grid[p]), ALL);
    const givenAway = (grid: readonly number[], digit: number) =>
      UNITS.flatMap((u) => {
        if (u.cells.some((i) => grid[i] === digit)) return [];
        const spots = u.cells.filter((i) => !grid[i] && candidates(grid, i) & (1 << digit));
        return spots.length === 1 ? spots : [];
      })[0];
    let counted = 0;
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
      let state = newGame("easy", seed);
      const moves: Move[] = [];
      let digit = 1;
      while (state.status === "playing") {
        let cell: number | undefined;
        for (let k = 0; k < 9 && cell === undefined; k++, digit = (digit % 9) + 1) cell = givenAway(state.grid, digit);
        cell ??= state.grid.findIndex((d) => !d);
        state = reduce(reduce(state, { type: "select", cell }), { type: "digit", digit: state.solution[cell] });
        moves.push(state.last!);
        const run = moves.slice(-9);
        if (run.length === 9 && run.every((m, k) => m.digit === k + 1)) counted++;
        expect(met({ kind: "move", state, move: state.last! }, moves.slice(-RECENT_MOVES))).not.toContain("constellation");
      }
    }
    expect(counted, "counts of 1 to 9 in a row").toBeGreaterThan(0);
  });
});

describe("Make a Wish", () => {
  const wish = (now: Date, step: "place" | "hint" | "miss" = "place", digit = 1) => {
    const game = playing();
    const moment = step === "place" ? game.place(digit) : step === "hint" ? game.hint(digit) : game.miss(digit);
    return met(moment, game.recent, now);
  };

  it("is met by a 1 placed at 1:11 or 11:11, morning or evening", () => {
    for (const [hour, minute] of [
      [11, 11],
      [23, 11],
      [1, 11],
      [13, 11],
    ])
      expect(wish(at(hour, minute)), `${hour}:${minute}`).toEqual(["make-a-wish"]);
    expect(wish(at(11, 11, 0))).toEqual(["make-a-wish"]);
    expect(wish(at(11, 11, 59))).toEqual(["make-a-wish"]);
  });

  it("is met by a hint that gives a 1 in that minute too", () => {
    expect(wish(at(23, 11), "hint")).toEqual(["make-a-wish"]);
  });

  it("is not met by another digit, a minute either side, at other hours, or by a refused 1", () => {
    for (const digit of [2, 4, 7, 9]) expect(wish(at(11, 11), "place", digit), `a ${digit}`).toEqual([]);
    expect(wish(at(11, 11), "hint", 4)).toEqual([]);
    for (const [hour, minute] of [
      [11, 10],
      [11, 12],
      [12, 11],
      [10, 11],
      [21, 11],
      [0, 11],
      [1, 1],
      [11, 1],
    ])
      expect(wish(at(hour, minute)), `${hour}:${minute}`).toEqual([]);
    expect(wish(at(11, 10, 59))).toEqual([]);
    expect(wish(at(11, 11), "miss")).toEqual([]);
  });

  it("is not met by a deal, a knock or a wait at 11:11", () => {
    const now = at(11, 11);
    const game = newGame("hard", 4242);
    expect(met({ kind: "deal", state: game }, [], now)).toEqual([]);
    expect(met({ kind: "emblem", taps: 1 }, [], now)).toEqual([]);
    expect(met({ kind: "idle", seconds: 30, state: game }, [], now)).toEqual([]);
  });
});

describe("Aurora on an ordinary afternoon", () => {
  it("hides nothing in a deal, one placement and one knock", () => {
    const game = playing();
    expect(met({ kind: "deal", state: game.state })).toEqual([]);
    expect(met(game.place(1), game.recent)).toEqual([]);
    expect(met({ kind: "emblem", taps: 1 })).toEqual([]);
  });

  it("answers odd moments without meeting anything", () => {
    expect(met({ kind: "emblem", taps: 0 })).toEqual([]);
    expect(met({ kind: "emblem", taps: Number.NaN })).toEqual([]);
    // A 1 whose move isn't in `recent`, and one at an invalid time.
    const game = playing();
    const moment = game.place(1);
    expect(met(moment, [], at(11, 11))).toEqual(["make-a-wish"]);
    expect(met(moment, game.recent, new Date(Number.NaN))).toEqual([]);
  });
});
