import { describe, expect, it } from "vitest";
import { newGame, reduce, type GameState, type Move } from "../game";
import { secretsAt, type Moment } from ".";
import { keypad } from "./keypad";
import { snow, stackedEights } from "./snow";

// Snow Day's secrets, each met by the moment it describes and missed by its near misses.

/** A December afternoon, in season. */
const NOW = new Date(2026, 11, 10, 14, 7);
const met = (moment: Moment, recent: readonly Move[] = []) => secretsAt("snow", { moment, now: NOW, recent }).map((s) => s.id);

/**
 * Plays `steps` (a cell and a digit, a hint, or a hint on a cell) on easy seed 777, whose column
 * of boxes 0 has all three 8s empty: cell 64 (box 6, the bottom), 38 (box 3) and 18 (box 0, the
 * top). Returns each move's moment, with the game's moves so far as its `recent`.
 */
function play(steps: readonly ([cell: number, digit: number] | "hint" | { hint: number })[], seed = 777) {
  let state: GameState = newGame("easy", seed);
  const moves: Move[] = [];
  return steps.map((step) => {
    if (step === "hint") state = reduce(state, { type: "hint" });
    else if ("hint" in step) state = reduce(reduce(state, { type: "select", cell: step.hint }), { type: "hint" });
    else state = reduce(reduce(state, { type: "select", cell: step[0] }), { type: "digit", digit: step[1] });
    moves.push(state.last!);
    return { moment: { kind: "move", state, move: state.last! } as Moment, recent: moves.slice() };
  });
}
const last = <T,>(list: readonly T[]) => list[list.length - 1];

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


describe("the game the stack is tested on", () => {
  it("has the three 8s of its first column of boxes empty, bottom to top at 64, 38 and 18", () => {
    const game = newGame("easy", 777);
    for (const cell of [64, 38, 18]) {
      expect(game.solution[cell]).toBe(8);
      expect(game.puzzle[cell]).toBe(0);
    }
  });
});

describe("Snowball Fight", () => {
  it("throws on the third quick tap on the title, and every third after", () => {
    expect(met({ kind: "emblem", taps: 3 })).toEqual(["snowball-fight"]);
    expect(met({ kind: "emblem", taps: 6 })).toEqual(["snowball-fight"]);
  });

  it("throws when the yard's snowman is poked the third time", () => {
    expect(met({ kind: "scene", target: "snowman-3" })).toEqual(["snowball-fight"]);
  });

  it("is missed by one or two taps, a fourth, or a single poke", () => {
    for (const taps of [1, 2, 4, 5]) expect(met({ kind: "emblem", taps }), `${taps} taps`).toEqual([]);
    expect(met({ kind: "scene", target: "snowman" })).toEqual([]);
    expect(met({ kind: "scene", target: "snowman-2" })).toEqual([]);
  });
});

describe("Snowman of 8s", () => {
  it("is met by three 8s stacked up one column of boxes, from the bottom box to the top", () => {
    const moments = play([
      [64, 8],
      [38, 8],
      [18, 8],
    ]);
    expect(met(moments[0].moment, moments[0].recent)).toEqual([]);
    expect(met(moments[1].moment, moments[1].recent)).toEqual([]);
    expect(met(moments[2].moment, moments[2].recent)).toEqual(["eight-snowman"]);
  });

  it("skips a refused digit in between", () => {
    const moments = play([
      [64, 8],
      [38, 8],
      [18, 5],
      [18, 8],
    ]);
    expect(moments[2].moment.kind === "move" && moments[2].moment.move.kind).toBe("miss");
    expect(met(moments[2].moment, moments[2].recent)).toEqual([]);
    expect(met(last(moments).moment, last(moments).recent)).toEqual(["eight-snowman"]);
  });

  it("is missed top down, two high, or with another digit or a hint in between", () => {
    const topDown = play([
      [18, 8],
      [38, 8],
      [64, 8],
    ]);
    expect(met(last(topDown).moment, last(topDown).recent)).toEqual([]);

    const twoHigh = play([
      [64, 8],
      [38, 8],
    ]);
    expect(met(last(twoHigh).moment, last(twoHigh).recent)).toEqual([]);

    const game = newGame("easy", 777);
    const other = game.grid.findIndex((d, i) => !d && game.solution[i] !== 8 && i !== 64 && i !== 38 && i !== 18);
    const interrupted = play([
      [64, 8],
      [38, 8],
      [other, game.solution[other]],
      [18, 8],
    ]);
    expect(met(last(interrupted).moment, last(interrupted).recent)).toEqual([]);

    const hinted = play([[64, 8], [38, 8], "hint", [18, 8]]);
    expect(met(last(hinted).moment, last(hinted).recent)).toEqual([]);

    // A hint that puts in the top 8 itself builds nothing: the stack is the player's own.
    const topHinted = play([[64, 8], [38, 8], { hint: 18 }]);
    const top = last(topHinted).moment;
    expect(top.kind === "move" && [top.move.kind, top.move.cell, top.move.digit]).toEqual(["hint", 18, 8]);
    expect(met(top, last(topHinted).recent)).toEqual([]);
  });

  it("stacks up any column of boxes whose three 8s are empty", () => {
    // Medium seed 28's middle and right columns of boxes have all three of their 8s empty.
    const game = newGame("medium", 28);
    const eights = (band: number) =>
      [2, 1, 0].map((tier) => game.solution.findIndex((d, i) => d === 8 && Math.floor((i % 9) / 3) === band && Math.floor(Math.floor(i / 9) / 3) === tier));
    for (const band of [1, 2]) {
      const cells = eights(band);
      for (const cell of cells) expect(game.puzzle[cell], `cell ${cell}`).toBe(0);
      let state: GameState = game;
      const moves: Move[] = [];
      for (const cell of cells) {
        state = reduce(reduce(state, { type: "select", cell }), { type: "digit", digit: 8 });
        moves.push(state.last!);
      }
      expect(met({ kind: "move", state, move: state.last! }, moves), `band ${band}`).toEqual(["eight-snowman"]);
    }
  });

  it("is missed when the stack leans into another column of boxes", () => {
    // The first column's bottom and middle 8s, then the 8 of the top right box (cell 6, empty).
    const game = newGame("easy", 777);
    expect([game.solution[6], game.puzzle[6]]).toEqual([8, 0]);
    const leaning = play([
      [64, 8],
      [38, 8],
      [6, 8],
    ]);
    expect(met(last(leaning).moment, last(leaning).recent)).toEqual([]);
    expect(stackedEights([], 1)).toBe(false);
  });
});

describe("Cocoa Break", () => {
  it("is met by placing 2, 6, 2, 6, 2 (COCOA on a phone keypad)", () => {
    const { moment, recent } = dial("cocoa");
    expect(met(moment, recent)).toEqual(["cocoa-break"]);
  });

  it("is missed by a typo, a short word or another drink", () => {
    for (const word of ["cocao", "coco", "ocoa", "cola", "tea"]) {
      const { moment, recent } = dial(word);
      expect(met(moment, recent), word).toEqual([]);
    }
  });
});

describe("every Snow Day secret's test", () => {
  it("never throws, whatever the moment brings", () => {
    const game = newGame("easy", 777);
    const odd: { moment: Moment; recent: readonly Move[] }[] = [
      { moment: { kind: "emblem", taps: 0 }, recent: [] },
      { moment: { kind: "emblem", taps: Number.NaN }, recent: [] },
      { moment: { kind: "scene", target: "" }, recent: [] },
      { moment: { kind: "deal", state: game }, recent: [] },
      { moment: { kind: "idle", seconds: 30, state: game }, recent: [] },
      // A move whose own record is missing from `recent`, and one with only misses before it.
      { moment: { kind: "move", state: game, move: { kind: "place", seq: 9, cell: 18, digit: 8, units: [], digitDone: false } }, recent: [] },
      {
        moment: { kind: "move", state: game, move: { kind: "place", seq: 3, cell: 18, digit: 8, units: [], digitDone: false } },
        recent: [
          { kind: "miss", seq: 1, cell: 64, digit: 3 },
          { kind: "miss", seq: 2, cell: 38, digit: 4 },
        ],
      },
    ];
    for (const { moment, recent } of odd)
      for (const secret of snow.secrets) {
        expect(() => secret.test({ moment, now: NOW, recent }), `${secret.id} on ${moment.kind}`).not.toThrow();
        expect(secret.test({ moment, now: NOW, recent }), `${secret.id} on ${moment.kind}`).toBe(false);
      }
  });
});

describe("Snow Day", () => {
  it("finds nothing on an ordinary afternoon: a deal, one 8, one tap", () => {
    const game = newGame("easy", 777);
    expect(met({ kind: "deal", state: game })).toEqual([]);
    const [one] = play([[64, 8]]);
    expect(met(one.moment, one.recent)).toEqual([]);
    expect(met({ kind: "emblem", taps: 1 })).toEqual([]);
  });

  it("names a surprise for every secret, and none is the season's arrival", () => {
    expect(snow.secrets.map((s) => s.surprise)).toEqual(["snowball", "stack", "cocoa"]);
  });
});
