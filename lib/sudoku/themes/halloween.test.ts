import { describe, expect, it } from "vitest";
import { newGame, reduce, type GameState, type Move } from "../game";
import { BOXES } from "../grid";
import { FACE } from "./halloween";
import { THEMES, secretsAt, type Moment } from ".";

// Halloween's secrets: each met by its own moment and missed by the near misses around it.

/** An October afternoon, in season. */
const AFTERNOON = new Date(2026, 9, 22, 15, 20);
const met = (moment: Moment, now = AFTERNOON, recent: readonly Move[] = []) => secretsAt("halloween", { moment, now, recent }).map((s) => s.id);

const place = (state: GameState, cell: number) => reduce(reduce(state, { type: "select", cell }), { type: "digit", digit: state.solution[cell] });
const moveOf = (state: GameState): Moment => ({ kind: "move", state, move: state.last! });
const emptyIn = (state: GameState, box: number) => BOXES[box].cells.filter((i) => !state.grid[i]);
const fill = (state: GameState, cells: readonly number[]) => cells.reduce(place, state);

describe("Trick or Treat: three knocks on the title's pumpkin", () => {
  it("opens on the third knock in a row", () => {
    expect(met({ kind: "emblem", taps: 3 })).toEqual(["trick-or-treat"]);
  });

  it("stays shut for two knocks, and a fourth doesn't play it again", () => {
    expect(met({ kind: "emblem", taps: 1 })).toEqual([]);
    expect(met({ kind: "emblem", taps: 2 })).toEqual([]);
    expect(met({ kind: "emblem", taps: 4 })).toEqual([]);
  });
});

describe("Board-o'-Lantern: only the face's boxes finished", () => {
  /** Boxes 1, 3 and 5 filled but for one cell each, and the face but for the last empty cell of box 8. */
  function carving(seed: number) {
    let state = newGame("easy", seed);
    for (const box of [1, 3, 5]) state = fill(state, emptyIn(state, box).slice(1));
    const face = [0, 2, 4, 6, 7, 8].flatMap((box) => emptyIn(state, box));
    const last = face[face.length - 1];
    state = fill(state, face.slice(0, -1));
    return { state, last, holes: [1, 3, 5].map((box) => emptyIn(state, box)[0]) };
  }
  /** A deal whose boxes 1, 3, 5 and 8 all have empty cells, so the pattern can be played. */
  const SEED = [2026, 2027, 2028, 2029, 2030].find((seed) => [1, 3, 5, 8].every((box) => emptyIn(newGame("easy", seed), box).length >= 2))!;

  it("is met by the move that finishes the face", () => {
    const { state, last } = carving(SEED);
    const done = place(state, last);
    expect(done.last).toMatchObject({ kind: "place" });
    expect(met(moveOf(done))).toEqual(["board-o-lantern"]);
  });

  it("is met by a hint that finishes the face, too", () => {
    const { state, last } = carving(SEED);
    const hinted = reduce(reduce(state, { type: "select", cell: last }), { type: "hint" });
    expect(hinted.last).toMatchObject({ kind: "hint", cell: last });
    expect(met(moveOf(hinted))).toEqual(["board-o-lantern"]);
  });

  it("is missed when another box was finished first", () => {
    const { state, last, holes } = carving(SEED);
    const done = place(place(state, holes[0]), last);
    expect(met(moveOf(done))).toEqual([]);
  });

  it("is missed by a refused digit in the face's last cell", () => {
    const { state, last } = carving(SEED);
    const wrong = (state.solution[last] % 9) + 1;
    const refused = reduce(reduce(state, { type: "select", cell: last }), { type: "digit", digit: wrong });
    expect(refused.last?.kind).toBe("miss");
    expect(met(moveOf(refused))).toEqual([]);
  });

  it("is missed when a feature is still open, and once the face is done", () => {
    let { state, last } = carving(SEED);
    // The right eye left open: finishing the grin doesn't make a face.
    const eye = emptyIn(newGame("easy", SEED), 2)[0];
    const open = { ...state, grid: state.grid.map((d, i) => (i === eye ? 0 : d)) };
    expect(met(moveOf(place(open, last)))).toEqual([]);
    // Carved, then a move after it: a hole of box 1 filled finishes box 1, a non-face box.
    state = place(state, last);
    const after = place(state, emptyIn(state, 1)[0]);
    expect(after.last).toMatchObject({ kind: "place" });
    expect(met(moveOf(after))).toEqual([]);
  });

  it("ignores a box that was all clues from the start", () => {
    const { state, last } = carving(SEED);
    // Box 1 dealt complete: its cells are clues, so the face is still the only box played to the end.
    const dealt = new Set(BOXES[1].cells);
    const given = {
      ...state,
      puzzle: state.puzzle.map((d, i) => (dealt.has(i) ? state.solution[i] : d)),
      grid: state.grid.map((d, i) => (dealt.has(i) ? state.solution[i] : d)),
    };
    expect(met(moveOf(place(given, last)))).toEqual(["board-o-lantern"]);
  });

  it("is missed one cell short of the face, and a pencil mark in that cell carves nothing", () => {
    const { state, last } = carving(SEED);
    expect(state.last).toMatchObject({ kind: "place" });
    expect(met(moveOf(state))).toEqual([]);
    const noted = reduce(reduce(reduce(state, { type: "notes" }), { type: "select", cell: last }), { type: "digit", digit: state.solution[last] });
    expect(noted.grid[last]).toBe(0);
    expect(noted.seq).toBe(state.seq);
  });

  it("never throws on odd input", () => {
    const { state, last } = carving(SEED);
    const done = place(state, last);
    const odd = [
      { kind: "move", state: { ...done, grid: undefined }, move: done.last },
      { kind: "move", state: undefined, move: done.last },
      { kind: "move", state: done, move: { ...done.last, units: undefined } },
      { kind: "move", state: done, move: undefined },
    ] as unknown as Moment[];
    const lantern = THEMES.halloween.secrets.find((s) => s.id === "board-o-lantern")!;
    for (const moment of odd) expect(lantern.test({ moment, now: AFTERNOON, recent: [] })).toBe(false);
  });

  it("is never met by a win, which finishes every box", () => {
    let state = newGame("easy", SEED);
    state = fill(state, state.grid.flatMap((d, i) => (d ? [] : [i])));
    expect(state.status).toBe("won");
    expect(met(moveOf(state))).toEqual([]);
    expect(FACE).toBe(0b111010101);
  });
});

describe("Halloween O'Clock: a 3 played at 10:31", () => {
  const game = newGame("easy", 4242);
  const cell = game.grid.findIndex((d, i) => !d && game.solution[i] === 3);
  const played = place(game, cell);
  const at = (hour: number, minute: number, second = 15) => new Date(2026, 9, 22, hour, minute, second);

  it("is met at 10:31 at night and in the morning", () => {
    expect(met(moveOf(played), at(22, 31))).toEqual(["halloween-oclock"]);
    expect(met(moveOf(played), at(10, 31, 59))).toEqual(["halloween-oclock"]);
  });

  it("is missed a minute either side, and at other hours", () => {
    for (const [hour, minute] of [
      [22, 30],
      [22, 32],
      [11, 31],
      [9, 31],
      [23, 31],
      [0, 31],
    ]) {
      expect(met(moveOf(played), at(hour, minute)), `${hour}:${minute}`).toEqual([]);
    }
  });

  it("is missed by any other digit at 10:31", () => {
    const other = game.grid.findIndex((d, i) => !d && game.solution[i] !== 3);
    expect(met(moveOf(place(game, other)), at(22, 31))).toEqual([]);
  });

  it("is met by a hint that fills a 3 at 10:31, too", () => {
    const hinted = reduce(reduce(game, { type: "select", cell }), { type: "hint" });
    expect(hinted.last?.kind).toBe("hint");
    expect(met(moveOf(hinted), at(10, 31, 0))).toEqual(["halloween-oclock"]);
  });

  it("is missed by a refused digit at 10:31", () => {
    const wrong = (game.solution[cell] % 9) + 1;
    const refused = reduce(reduce(game, { type: "select", cell }), { type: "digit", digit: wrong });
    expect(refused.last?.kind).toBe("miss");
    expect(met(moveOf(refused), at(22, 31))).toEqual([]);
  });

  it("listens only to moves (a deal or a title tap at 10:31 finds nothing)", () => {
    expect(met({ kind: "deal", state: game }, at(22, 31))).toEqual([]);
    expect(met({ kind: "emblem", taps: 1 }, at(22, 31))).toEqual([]);
  });
});
