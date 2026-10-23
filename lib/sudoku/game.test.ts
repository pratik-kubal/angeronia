import { describe, expect, it } from "vitest";
import { HINTS, digitCounts, finishedBy, newGame, parseSaved, reduce, type Action, type GameState } from "./game";
import { PEERS, ROWS, UNITS_OF } from "./grid";

const play = (state: GameState, ...actions: Action[]) => actions.reduce(reduce, state);
const fresh = () => newGame("easy", 11);
const empties = (s: GameState) => s.grid.flatMap((d, i) => (d ? [] : [i]));
const wrong = (s: GameState, cell: number) => (s.solution[cell] % 9) + 1;

describe("game", () => {
  it("starts from the puzzle with every hint and no trophy", () => {
    const s = fresh();
    expect(s.grid).toEqual(s.puzzle);
    expect(s.hintsLeft).toBe(HINTS);
    expect(s.status).toBe("playing");
    expect(s.trophy).toBeNull();
    expect(s).not.toHaveProperty("mistakes");
  });

  it("locks a correct digit", () => {
    const s0 = fresh();
    const [a] = empties(s0);
    const s1 = play(s0, { type: "select", cell: a }, { type: "digit", digit: s0.solution[a] });
    expect(s1.grid[a]).toBe(s0.solution[a]);
    expect(s1.last).toMatchObject({ kind: "place", cell: a, digit: s0.solution[a], seq: 1 });
    // A filled cell takes no other digit.
    expect(play(s1, { type: "digit", digit: wrong(s1, a) })).toBe(s1);
  });

  it("refuses a wrong digit without counting anything", () => {
    const s0 = fresh();
    const [a] = empties(s0);
    let s = play(s0, { type: "select", cell: a });
    for (let k = 0; k < 10; k++) s = play(s, { type: "digit", digit: wrong(s0, a) });
    expect(s.grid).toEqual(s0.grid);
    expect(s.status).toBe("playing");
    expect(s.last).toMatchObject({ kind: "miss", cell: a, digit: wrong(s0, a) });
    expect(s.seq).toBe(10);
  });

  it("wins when the last cell fills, stops the clock, and takes one trophy", () => {
    let s = play(fresh(), { type: "tick", ms: 5000 });
    expect(play(s, { type: "award", trophy: "too-early" }).trophy).toBeNull();
    for (const cell of empties(s)) s = play(s, { type: "select", cell }, { type: "digit", digit: s.solution[cell] });
    expect(s.grid).toEqual(s.solution);
    expect(s.status).toBe("won");
    expect(s.selected).toBeNull();
    expect(s.elapsed).toBe(5000);
    expect(play(s, { type: "tick", ms: 1000 }).elapsed).toBe(5000);
    expect(digitCounts(s.grid).slice(1)).toEqual(Array(9).fill(9));
    // The last digit finishes its row, column and box, and its set.
    expect(s.last).toMatchObject({ kind: "place", digitDone: true });
    expect(s.last?.kind === "place" && s.last.units).toHaveLength(3);
    const awarded = play(s, { type: "award", trophy: "first" }, { type: "award", trophy: "second" });
    expect(awarded.trophy).toBe("first");
  });

  it("reports the rows, columns and boxes a digit finishes", () => {
    const { solution } = fresh();
    expect(finishedBy(solution, 40, solution[40])).toEqual({ units: UNITS_OF[40], digitDone: true });
    // Open the rest of column 1 (and so box 1) and one other cell of cell 0's digit: only row 1 is finished.
    const grid = solution.slice();
    for (let r = 1; r < 9; r++) grid[r * 9] = 0;
    grid[solution.findIndex((d, i) => i !== 0 && d === solution[0])] = 0;
    expect(finishedBy(grid, 0, solution[0])).toEqual({ units: [ROWS[0]], digitDone: false });
  });

  it("toggles pencil marks in notes mode, and a placement clears them from its peers", () => {
    const s0 = fresh();
    const a = empties(s0)[0];
    const peer = PEERS[a].find((p) => !s0.grid[p])!;
    const d = s0.solution[a];
    let s = play(s0, { type: "notes" }, { type: "select", cell: peer }, { type: "digit", digit: d });
    expect(s.notes[peer]).toBe(1 << d);
    s = play(s, { type: "select", cell: a }, { type: "digit", digit: 1 }, { type: "digit", digit: 2 }, { type: "digit", digit: 1 });
    expect(s.notes[a]).toBe(1 << 2);
    expect(s.grid[a]).toBe(0);
    s = play(s, { type: "notes" }, { type: "digit", digit: d });
    expect(s.notes[a]).toBe(0);
    expect(s.notes[peer]).toBe(0);
  });

  it("hints the selected empty cell, else the likeliest one", () => {
    const s0 = fresh();
    const [a, b] = empties(s0);
    const s1 = play(s0, { type: "select", cell: b }, { type: "hint" });
    expect(s1.grid[b]).toBe(s0.solution[b]);
    expect(s1.hintsLeft).toBe(HINTS - 1);
    expect(s1.last).toMatchObject({ kind: "hint", cell: b });
    // With a filled cell selected, the hint picks an empty one and selects it.
    const s2 = play(s1, { type: "hint" });
    expect(s2.selected).not.toBe(b);
    expect(s2.grid[s2.selected!]).toBe(s0.solution[s2.selected!]);
    const out = play(s2, { type: "select", cell: a }, { type: "hint" });
    expect(out.hintsLeft).toBe(0);
    expect(play(out, { type: "hint" })).toBe(out);
  });

  it("steps the selection with wraparound; with nothing selected, a step selects the first cell", () => {
    expect(play(fresh(), { type: "step", dRow: 0, dCol: 1 }).selected).toBe(0);
    const s = play(fresh(), { type: "select", cell: 0 }, { type: "step", dRow: 0, dCol: -1 });
    expect(s.selected).toBe(8);
    expect(play(s, { type: "step", dRow: -1, dCol: 0 }).selected).toBe(80);
  });

  it("reads back only what this version saved", () => {
    const s = fresh();
    expect(parseSaved(JSON.parse(JSON.stringify(s)))).toEqual(s);
    expect(parseSaved(null)).toBeNull();
    expect(parseSaved({ ...s, version: 2 })).toBeNull();
    expect(parseSaved({ ...s, grid: s.grid.slice(1) })).toBeNull();
    expect(parseSaved({ ...s, elapsed: undefined })).toBeNull();
    expect(parseSaved({ ...s, selected: 99 })).toBeNull();
    expect(parseSaved({ ...s, difficulty: "nightmare" })).toBeNull();
    expect(parseSaved({ ...s, grid: s.grid.map(() => 12) })).toBeNull();
  });
});
