import { describe, expect, it } from "vitest";
import { newGame, reduce, type GameState, type Move } from "../game";
import { BOXES } from "../grid";
import { secretById, secretsAt, type Moment } from ".";
import { finishedBoxes } from "./beach";
import { keypad } from "./keypad";

// Beach's secrets: each met by its own moment and missed by the near misses around it.

/** A summer afternoon, in season. */
const NOW = new Date(2026, 6, 14, 15, 20);
const met = (moment: Moment, recent: readonly Move[] = []) => secretsAt("beach", { moment, now: NOW, recent }).map((s) => s.id);

/** Places the solution digit in `cell` (selecting it first). */
const place = (state: GameState, cell: number) => reduce(reduce(state, { type: "select", cell }), { type: "digit", digit: state.solution[cell] });

/** Fills every empty cell of box `b`, but for the ones listed in `except`. */
function fillBox(state: GameState, b: number, except: readonly number[] = []): GameState {
  for (const cell of BOXES[b].cells) if (!state.grid[cell] && !except.includes(cell)) state = place(state, cell);
  return state;
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

/** The moment of the latest move. */
const moveOf = (state: GameState): Moment => ({ kind: "move", state, move: state.last! });

describe("Seven Seas", () => {
  it("is met by seven quick taps on the shell", () => {
    expect(met({ kind: "emblem", taps: 7 })).toEqual(["seven-seas"]);
  });

  it("is not met by six taps, eight or one", () => {
    expect(met({ kind: "emblem", taps: 6 })).toEqual([]);
    expect(met({ kind: "emblem", taps: 8 })).toEqual([]);
    expect(met({ kind: "emblem", taps: 1 })).toEqual([]);
  });

  it("is not met, and never throws, on odd taps", () => {
    const { test } = secretById("beach", "seven-seas")!;
    for (const taps of [0, -7, 7.5, NaN, undefined]) expect(test({ moment: { kind: "emblem", taps } as Moment, now: NOW, recent: [] })).toBe(false);
  });
});

describe("Four Towers", () => {
  // A real game with no box given whole: its four corners filled first, then the centre; the
  // centre's last empty cell is the move that finishes the keep.
  const start = newGame("easy", 777);
  const emptyOf = (state: GameState, b: number) => BOXES[b].cells.filter((cell) => !state.grid[cell]);
  const towers = [0, 2, 6, 8].reduce((state, b) => fillBox(state, b), start);
  const last = emptyOf(towers, 4).at(-1)!;
  const almost = fillBox(towers, 4, [last]);

  it("starts from a deal with no finished box", () => {
    expect(finishedBoxes(start.puzzle)).toBe(0);
    expect(finishedBoxes(almost.grid)).toBe(0b101000101);
  });

  it("is met by the move that finishes the keep after the four towers", () => {
    const done = place(almost, last);
    expect(done.last).toMatchObject({ kind: "place", cell: last });
    expect(finishedBoxes(done.grid)).toBe(0b101010101);
    expect(met(moveOf(done))).toEqual(["four-towers"]);
  });

  it("counts a hint that finishes the keep", () => {
    const hinted = reduce(reduce(almost, { type: "select", cell: last }), { type: "hint" });
    expect(hinted.last).toMatchObject({ kind: "hint", cell: last });
    expect(met(moveOf(hinted))).toEqual(["four-towers"]);
  });

  it("is not met by the move that finishes the fourth tower", () => {
    const corner = emptyOf(start, 8).at(-1)!;
    const fourth = place(fillBox(fillBox(fillBox(fillBox(start, 0), 2), 6), 8, [corner]), corner);
    expect(finishedBoxes(fourth.grid)).toBe(0b101000101);
    expect(met(moveOf(fourth))).toEqual([]);
  });

  it("is not met when the keep comes before the last tower", () => {
    const corner = emptyOf(start, 8).at(-1)!;
    const keepFirst = fillBox(fillBox(fillBox(fillBox(fillBox(start, 0), 2), 6), 4), 8, [corner]);
    expect(finishedBoxes(keepFirst.grid)).toBe(0b001010101);
    const done = place(keepFirst, corner);
    expect(finishedBoxes(done.grid)).toBe(0b101010101);
    expect(met(moveOf(done))).toEqual([]);
  });

  it("is not met when another box was finished before the keep", () => {
    const withTop = fillBox(almost, 1);
    expect(finishedBoxes(withTop.grid) & 0b10).toBe(0b10);
    expect(met(moveOf(place(withTop, last)))).toEqual([]);
  });

  it("is not met by a later move, nor by the next box finished", () => {
    const done = place(almost, last);
    const later = place(done, emptyOf(done, 1)[0]);
    expect(met(moveOf(later))).toEqual([]);
    const sixth = fillBox(done, 3);
    expect(sixth.last?.kind === "place" && sixth.last.units.some((u) => u.kind === "box" && u.index === 3)).toBe(true);
    expect(met(moveOf(sixth))).toEqual([]);
  });

  it("is not met by a refused digit on the keep's last cell", () => {
    const wrong = (almost.solution[last] % 9) + 1;
    const refused = reduce(reduce(almost, { type: "select", cell: last }), { type: "digit", digit: wrong });
    expect(refused.last?.kind).toBe("miss");
    expect(met(moveOf(refused))).toEqual([]);
  });

  it("is not met, and never throws, on an odd move", () => {
    const done = place(almost, last);
    const odd = [
      { kind: "move", state: done, move: { kind: "place", seq: 1, cell: last, digit: 1 } },
      { kind: "move", state: undefined, move: done.last },
      { kind: "move", state: { ...done, grid: undefined }, move: done.last },
      { kind: "move", state: { ...done, puzzle: null }, move: done.last },
      { kind: "move", state: done, move: { ...done.last, units: null } },
    ] as unknown as Moment[];
    const { test } = secretById("beach", "four-towers")!;
    for (const moment of odd) expect(test({ moment, now: NOW, recent: [] })).toBe(false);
  });
});

describe("Fry Thief", () => {
  it("is met by placing 4, 8, 5, 5 (GULL on a phone keypad)", () => {
    const { moment, recent } = dial("gull");
    expect(met(moment, recent)).toEqual(["fry-thief"]);
  });

  it("is not met one digit short, or by a word one letter off", () => {
    // ("hull" would meet it: H and G share the 4.)
    for (const word of ["gul", "ull", "gulp", "gall"]) {
      const { moment, recent } = dial(word);
      expect(met(moment, recent), word).toEqual([]);
    }
  });
});
