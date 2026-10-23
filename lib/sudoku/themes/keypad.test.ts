import { describe, expect, it } from "vitest";
import { newGame, type Move } from "../game";
import { keypad, spells } from "./keypad";
import type { Moment } from "./types";

const state = newGame("easy", 1);
let seq = 0;
const place = (digit: number): Move => ({ kind: "place", seq: ++seq, cell: 0, digit, units: [], digitDone: false });
const hint = (digit: number): Move => ({ kind: "hint", seq: ++seq, cell: 0, digit, units: [], digitDone: false });
const miss = (digit: number): Move => ({ kind: "miss", seq: ++seq, cell: 0, digit });

/** Whether the last move of `moves` (as its moment, with `moves` as recent) spells the word. */
const spelled = (word: string, moves: Move[]) =>
  spells({ moment: { kind: "move", state, move: moves[moves.length - 1] }, now: new Date(2026, 6, 1, 14), recent: moves }, word);

describe("keypad", () => {
  it("turns a word into its digits on a phone's number keys", () => {
    expect(keypad("gull")).toEqual([4, 8, 5, 5]);
    expect(keypad("cocoa")).toEqual([2, 6, 2, 6, 2]);
    expect(keypad("buzz")).toEqual([2, 8, 9, 9]);
    expect(keypad("PQRS wxyz")).toEqual([7, 7, 7, 7, -1, 9, 9, 9, 9]);
  });
});

describe("spells", () => {
  it("is met when the last digits placed are the word's, the last one just now", () => {
    expect(spelled("gull", [place(1), place(4), place(8), place(5), place(5)])).toBe(true);
  });

  it("forgives a refused digit in the middle", () => {
    expect(spelled("gull", [place(4), place(8), miss(3), place(5), miss(9), place(5)])).toBe(true);
  });

  it("is not met one short, out of order, with a digit too many, or by a hint", () => {
    expect(spelled("gull", [place(8), place(5), place(5)])).toBe(false);
    expect(spelled("gull", [place(4), place(5), place(8), place(5)])).toBe(false);
    expect(spelled("gull", [place(4), place(8), place(5), place(5), place(5)])).toBe(false);
    expect(spelled("gull", [place(4), hint(8), place(5), place(5)])).toBe(false);
    expect(spelled("gull", [place(4), place(8), place(5), hint(5)])).toBe(false);
  });

  it("is met only by the moment of the word's last digit", () => {
    const moves = [place(4), place(8), place(5), place(5)];
    const last = moves[3];
    moves.push(place(7));
    expect(spells({ moment: { kind: "move", state, move: last }, now: new Date(), recent: moves }, "gull")).toBe(false);
  });

  it("is not met, and never throws, on other moments or odd input", () => {
    const odd = [
      { kind: "deal", state },
      { kind: "emblem", taps: 4 },
      { kind: "move", state, move: miss(5) },
      { kind: "move", state },
      undefined,
    ] as unknown as Moment[];
    for (const moment of odd) expect(spells({ moment, now: new Date(), recent: [place(4), place(8), place(5), place(5)] }, "gull")).toBe(false);
    expect(spells({ moment: { kind: "move", state, move: place(5) }, now: new Date(), recent: null as unknown as Move[] }, "gull")).toBe(false);
  });
});
