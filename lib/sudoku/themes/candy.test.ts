import { describe, expect, it } from "vitest";
import { newGame, reduce, type GameState, type Move } from "../game";
import { secretById, secretsAt, type Moment } from ".";
import { RAINBOW } from "./candy";
import { keypad } from "./keypad";

// Candy's secrets: each met by its own moment and missed by the near misses around it. Candy has no
// season, so an ordinary September afternoon will do.

const NOW = new Date(2026, 8, 16, 14, 7);
const met = (moment: Moment, recent: readonly Move[] = []) => secretsAt("candy", { moment, now: NOW, recent }).map((s) => s.id);

/**
 * Plays `steps` on easy seed 777, each a digit placed by hand in an empty cell that takes it, a
 * refused digit (`"miss"`) or a hint (`"hint"`); the last step's moment and the moves so far.
 */
function play(steps: readonly (number | "miss" | "hint")[]) {
  let state: GameState = newGame("easy", 777);
  const recent: Move[] = [];
  for (const step of steps) {
    if (step === "hint") {
      const cell = state.grid.findIndex((d) => !d);
      state = reduce(reduce(state, { type: "select", cell }), { type: "hint" });
    } else if (step === "miss") {
      const cell = state.grid.findIndex((d) => !d);
      state = reduce(reduce(state, { type: "select", cell }), { type: "digit", digit: (state.solution[cell] % 9) + 1 });
    } else {
      const cell = state.grid.findIndex((d, i) => !d && state.solution[i] === step);
      expect(cell, `an empty cell for ${step}`).toBeGreaterThanOrEqual(0);
      state = reduce(reduce(state, { type: "select", cell }), { type: "digit", digit: step });
    }
    recent.push(state.last!);
  }
  return { moment: { kind: "move", state, move: state.last! } as Moment, recent };
}

describe("Unwrapped", () => {
  it("is met by four quick taps on the sweet, and every fourth after", () => {
    expect(met({ kind: "emblem", taps: 4 })).toEqual(["unwrapped"]);
    expect(met({ kind: "emblem", taps: 8 })).toEqual(["unwrapped"]);
  });

  it("is not met by one to three taps, five to seven, or nine", () => {
    for (const taps of [1, 2, 3, 5, 6, 7, 9]) expect(met({ kind: "emblem", taps }), `${taps}`).toEqual([]);
  });

  it("is not met, and never throws, on odd taps", () => {
    const { test } = secretById("candy", "unwrapped")!;
    for (const taps of [0, -4, 4.5, NaN, undefined]) expect(test({ moment: { kind: "emblem", taps } as Moment, now: NOW, recent: [] })).toBe(false);
  });
});

describe("Candy Jar", () => {
  it("is met by placing 2, 2, 6, 3, 9 (CANDY on a phone keypad)", () => {
    const { moment, recent } = play(keypad("candy"));
    expect(met(moment, recent)).toEqual(["candy-jar"]);
  });

  it("forgives a refused digit inside the word, but not a hint", () => {
    const [c, a, n, d, y] = keypad("candy");
    let { moment, recent } = play([c, a, "miss", n, d, y]);
    expect(met(moment, recent)).toEqual(["candy-jar"]);
    ({ moment, recent } = play([c, a, "hint", n, d, y]));
    expect(met(moment, recent)).toEqual([]);
  });

  it("is not met one letter short, or by a word one letter off", () => {
    for (const word of ["andy", "cand", "dandy", "candid"]) {
      const { moment, recent } = play(keypad(word));
      expect(met(moment, recent), word).toEqual([]);
    }
  });
});

describe("Rainbow Drops", () => {
  it("is met by placing 1, 2, 5, 7, 9: red, orange, green, blue and purple", () => {
    const { moment, recent } = play(RAINBOW);
    expect(met(moment, recent)).toEqual(["rainbow-drops"]);
  });

  it("is not met out of order, one colour short, or broken by a hint", () => {
    for (const steps of [
      [1, 2, 5, 9, 7],
      [2, 5, 7, 9],
      [1, 2, 3, 5, 7, 9],
      [1, 2, "hint", 5, 7, 9],
    ] as const) {
      const { moment, recent } = play(steps);
      expect(met(moment, recent), steps.join("-")).toEqual([]);
    }
  });
});
