import { describe, expect, it } from "vitest";
import { newGame, reduce, type GameState, type Move } from "../game";
import { colOf, rowOf } from "../grid";
import { blossom } from "./blossom";
import { keypad } from "./keypad";
import { secretsAt, type Moment, type SecretContext } from ".";

// Blossom's secrets: each met by its own moment and missed by the near misses around it.

/** A spring afternoon, in season. */
const NOW = new Date(2026, 3, 12, 15, 20);
const met = (moment: Moment, recent: readonly Move[] = []) =>
  secretsAt("blossom", {
    moment,
    now: NOW,
    recent,
  } satisfies SecretContext).map((s) => s.id);

/** Empty cells taking `digits` in turn, no two in one row or column (a search, so it always finds them when they exist). */
function apart(state: GameState, digits: readonly number[], used: number[] = []): number[] | null {
  if (!digits.length) return used;
  for (let i = 0; i < 81; i++) {
    if (state.grid[i] || state.solution[i] !== digits[0] || used.some((u) => rowOf(u) === rowOf(i) || colOf(u) === colOf(i))) continue;
    const rest = apart(state, digits.slice(1), [...used, i]);
    if (rest) return rest;
  }
  return null;
}

/** A game played step by step, keeping this tab's moves (a secret's `recent`). */
function playing(seed = 12345) {
  let state: GameState = newGame("easy", seed);
  const moves: Move[] = [];
  /** Cells chosen ahead for `digit` (the countdown's, apart); else the first empty cell that takes it. */
  const planned = new Map<number, number>();
  const emptyFor = (digit: number) => planned.get(digit) ?? state.grid.findIndex((d, i) => !d && state.solution[i] === digit);
  const record = () => {
    moves.push(state.last!);
    return { kind: "move", state, move: state.last! } as Moment;
  };
  return {
    /** Places `digit` by hand in an empty cell that takes it. */
    place(digit: number): Moment {
      state = reduce(reduce(state, { type: "select", cell: emptyFor(digit) }), {
        type: "digit",
        digit,
      });
      expect(state.last).toMatchObject({ kind: "place", digit });
      return record();
    },
    /** Tries `digit` in an empty cell that doesn't take it (refused). */
    miss(digit: number): Moment {
      const cell = state.grid.findIndex((d, i) => !d && state.solution[i] !== digit);
      state = reduce(reduce(state, { type: "select", cell }), {
        type: "digit",
        digit,
      });
      expect(state.last?.kind).toBe("miss");
      return record();
    },
    /** A hint in the empty cell that takes `digit`. */
    hint(digit: number): Moment {
      state = reduce(reduce(state, { type: "select", cell: emptyFor(digit) }), {
        type: "hint",
      });
      expect(state.last).toMatchObject({ kind: "hint", digit });
      return record();
    },
    /** Whether an empty cell still takes `digit`. */
    canPlace: (digit: number) => emptyFor(digit) >= 0,
    /** Places each digit in turn, returning the last one's moment. */
    run(digits: readonly number[]): Moment {
      return digits.map((d) => this.place(d)).at(-1)!;
    },
    /** From now on, `digits` go in cells no two of which share a row or a column. */
    spread(digits: readonly number[]) {
      const cells = apart(state, digits);
      expect(cells).not.toBeNull();
      planned.clear();
      digits.forEach((d, k) => planned.set(d, cells![k]));
      return this;
    },
    get recent() {
      return moves.slice(-30);
    },
  };
}

/** `word` spelled on the keypad: its digits placed by hand in turn, in empty cells of easy seed 777; the last digit's moment and the moves so far. */
function dial(word: string) {
  let state: GameState = newGame("easy", 777);
  const recent: Move[] = [];
  for (const digit of keypad(word)) {
    const cell = state.grid.findIndex((d, i) => !d && state.solution[i] === digit);
    expect(cell, `an empty cell for ${digit}`).toBeGreaterThanOrEqual(0);
    state = reduce(reduce(state, { type: "select", cell }), { type: "digit", digit });
    recent.push(state.last!);
  }
  return { moment: { kind: "move", state, move: state.last! } as Moment, recent };
}

const COUNTDOWN = [7, 6, 5, 4, 3, 2, 1];

describe("Petal Shower", () => {
  it("is met by five quick taps on the title, and every fifth after", () => {
    expect(met({ kind: "emblem", taps: 5 })).toEqual(["petal-shower"]);
    expect(met({ kind: "emblem", taps: 10 })).toEqual(["petal-shower"]);
  });

  it("is not met by four taps, six, or a tap on the scene", () => {
    expect(met({ kind: "emblem", taps: 4 })).toEqual([]);
    expect(met({ kind: "emblem", taps: 6 })).toEqual([]);
    expect(met({ kind: "emblem", taps: 1 })).toEqual([]);
    expect(met({ kind: "scene", target: "branch" })).toEqual([]);
  });
});

describe("After the Rain", () => {
  it("is met by placing 7 down to 1, one after another, each in its own row and column", () => {
    const game = playing().spread(COUNTDOWN);
    expect(met(game.run(COUNTDOWN), game.recent)).toEqual(["after-the-rain"]);
  });

  it("is not met when two of the seven share a row or a column", () => {
    const game = playing();
    const cells: number[] = [];
    const last = COUNTDOWN.map((d) => {
      const moment = game.place(d);
      if (moment.kind === "move") cells.push(moment.move.cell);
      return moment;
    }).at(-1)!;
    // The first cell for each digit, top to bottom: some of them share a row or a column.
    expect(new Set(cells.map(rowOf)).size < 7 || new Set(cells.map(colOf)).size < 7).toBe(true);
    expect(met(last, game.recent)).toEqual([]);
  });

  it("forgives a refused digit in the middle of the countdown", () => {
    const game = playing(777).spread(COUNTDOWN);
    game.run([7, 6, 5, 4]);
    game.miss(9);
    game.run([3, 2]);
    expect(met(game.place(1), game.recent)).toEqual(["after-the-rain"]);
  });

  it("is met only on the 1 itself, never on the moves before", () => {
    const game = playing().spread(COUNTDOWN);
    for (const d of COUNTDOWN.slice(0, -1)) expect(met(game.place(d), game.recent)).toEqual([]);
  });

  it("is not met counting up: 1 to 7, or one of each digit round the pad", () => {
    const up = playing();
    expect(met(up.run([1, 2, 3, 4, 5, 6, 7]), up.recent)).toEqual([]);

    // A player going round the pad, one of each digit while it has a cell left: never meets it,
    // however long they go on.
    const round = playing(4242);
    let placed = 0;
    for (let k = 0; k < 45; k++) {
      const digit = (k % 9) + 1;
      if (!round.canPlace(digit)) continue;
      expect(met(round.place(digit), round.recent)).toEqual([]);
      placed++;
    }
    expect(placed).toBeGreaterThan(20);
  });

  it("is not met one short, or ending on another digit", () => {
    const short = playing().spread([6, 5, 4, 3, 2, 1]);
    expect(met(short.run([6, 5, 4, 3, 2, 1]), short.recent)).toEqual([]);

    const skipped = playing().spread([8, 7, 6, 5, 4, 3, 1]);
    expect(met(skipped.run([8, 7, 6, 5, 4, 3, 1]), skipped.recent)).toEqual([]);

    const past = playing().spread([...COUNTDOWN.slice(0, -1), 9]);
    expect(met(past.run([...COUNTDOWN.slice(0, -1), 9]), past.recent)).toEqual([]);
  });

  it("is broken by a hint, and not met when the 1 is a hint", () => {
    const a = playing().spread(COUNTDOWN);
    a.run([7, 6, 5]);
    a.hint(4);
    a.run([3, 2]);
    expect(met(a.place(1), a.recent)).toEqual([]);

    const b = playing(4242).spread(COUNTDOWN);
    b.run(COUNTDOWN.slice(0, -1));
    expect(met(b.hint(1), b.recent)).toEqual([]);
  });

  it("is not met out of order, or by a moment whose move isn't the countdown's last", () => {
    const a = playing().spread(COUNTDOWN);
    a.run([7, 6, 5, 3, 4, 2]);
    expect(met(a.place(1), a.recent)).toEqual([]);

    const b = playing().spread(COUNTDOWN);
    const one = b.run(COUNTDOWN);
    b.place(8);
    // The 1's moment, asked again after another move: the countdown no longer ends on it.
    expect(met(one, b.recent)).toEqual([]);
  });
});

describe("Busy Bee", () => {
  it("is met by placing 2, 8, 9, 9 (BUZZ on a phone keypad)", () => {
    const { moment, recent } = dial("buzz");
    expect(met(moment, recent)).toEqual(["busy-bee"]);
  });

  it("is not met by a near word", () => {
    for (const word of ["buz", "uzz", "bzz", "fuzz", "buzzy"]) {
      const { moment, recent } = dial(word);
      expect(met(moment, recent), word).toEqual([]);
    }
  });
});

describe("every secret", () => {
  it("answers odd moments and odd moves with false, never a throw", () => {
    const state = newGame("easy", 1);
    const odd = [
      { kind: "emblem" },
      { kind: "emblem", taps: Number.NaN },
      { kind: "emblem", taps: -5 },
      { kind: "move", state },
      { kind: "move", state, move: null },
      { kind: "move", state, move: { kind: "place", seq: 1, cell: 0, digit: 1, units: [], digitDone: false } },
      { kind: "win", state },
      { kind: "scene" },
      null,
    ] as unknown as Moment[];
    const recents = [[], [null, undefined], [{ kind: "place" }], null] as unknown as Move[][];
    for (const secret of blossom.secrets) {
      for (const moment of odd) {
        for (const recent of recents) expect(secret.test({ moment, now: NOW, recent }), `${secret.id} ${JSON.stringify(moment)}`).toBe(false);
      }
    }
  });
});
