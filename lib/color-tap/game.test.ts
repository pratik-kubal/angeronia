import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  autoPlan,
  colourProgress,
  isColourDone,
  magnifierTarget,
  makeBoard,
  newGame,
  nextColour,
  openAreas,
  parseSaved,
  reduce,
  toSaved,
  type Action,
  type Board,
  type GameState,
  type Saved,
} from "./game";
import { PICTURES } from "./pictures";
import { decodePuzzle } from "./puzzle";
import type { LevelId, Puzzle } from "./types";

// The rules of a painting, proven on small hand-made boards whose answers can be worked out by
// hand, and on a real committed puzzle: an area takes only its own colour and stays painted, a
// wrong or repeated tap changes nothing (the very same state comes back), the clock and the
// magnifier never go below what makes sense, auto-paint paints every open area exactly once in
// the order promised, and a save reads back to the same game while anything else is turned away.

/** A puzzle from [colour, area, label x, label y] per area; outlines don't matter to the rules. */
function handMade(areas: readonly [number, number, number, number][], colours: number): Puzzle {
  return {
    id: "hand",
    picture: "hand",
    level: "easy",
    width: 100,
    height: 100,
    palette: Array.from({ length: colours }, (_, i) => `#${i.toString(16).padStart(6, "0")}`),
    regions: areas.map(([colour, area, x, y]) => ({ colour, area, box: [0, 0, 1, 1], labels: [{ x, y, r: 3 }], rings: [] })),
    segments: [],
  };
}

// Four colours over eight areas. Colour 0's numbers sit on a line at x 0, 20, 10 and 100, so from
// x 12 the nearest-neighbour chain is 4, then 0 or 2 (both 10 away: the lower index, 0), then 2, 6.
const LINE = handMade(
  [
    [0, 50, 0, 0],
    [1, 40, 10, 10],
    [0, 30, 20, 0],
    [2, 30, 5, 5],
    [0, 30, 10, 0],
    [1, 40, 40, 10],
    [0, 60, 100, 0],
    [3, 20, 60, 60],
  ],
  4,
);
const BOARD = makeBoard(LINE);

const fresh = (board: Board) => newGame(board, "hand", "easy", "hand", 3);
const play = (state: GameState, board: Board, ...actions: Action[]) => actions.reduce((s, a) => reduce(s, a, board), state);
const tap = (area: number): Action => ({ type: "fill", area, auto: false });
const brush = (area: number): Action => ({ type: "fill", area, auto: true });
const pick = (colour: number): Action => ({ type: "select", colour });
/** Paints the given areas, selecting each one's colour first, as a player would. */
const paint = (state: GameState, board: Board, areas: readonly number[]) =>
  areas.reduce((s, a) => play(s, board, pick(board.colourOf[a]), tap(a)), state);

/** A committed puzzle and its board, found by picture index and level. */
function committed(picture: number, level: LevelId) {
  const info = PICTURES[picture];
  const entry = info.levels.find((l) => l.level === level)!;
  const puzzle = decodePuzzle(JSON.parse(fs.readFileSync(path.join("public", entry.src), "utf8")));
  return { info, entry, puzzle, board: makeBoard(puzzle) };
}

// Master has well over 256 areas, so a save's indices need both of their bytes.
const REAL = committed(0, "master");
const realGame = () => newGame(REAL.board, REAL.info.id, REAL.entry.level, REAL.puzzle.id, 8);
const realExpected = { picture: REAL.info.id, level: REAL.entry.level, puzzle: REAL.puzzle.id };
const handExpected = { picture: "hand", level: "easy" as LevelId, puzzle: "hand" };

describe("makeBoard", () => {
  it("flattens each area's colour, size and main label, and counts each colour's areas", () => {
    expect(BOARD.regions).toBe(8);
    expect(BOARD.colours).toBe(4);
    expect([...BOARD.colourOf]).toEqual([0, 1, 0, 2, 0, 1, 0, 3]);
    expect([...BOARD.area]).toEqual([50, 40, 30, 30, 30, 40, 60, 20]);
    expect([...BOARD.labelX]).toEqual([0, 10, 20, 5, 10, 40, 100, 60]);
    expect([...BOARD.labelY]).toEqual([0, 10, 0, 5, 0, 10, 0, 60]);
    expect([...BOARD.total]).toEqual([4, 2, 1, 1]);
  });

  it("takes the first label as the main one when an area has several", () => {
    const puzzle = handMade([[0, 900, 1, 2]], 1);
    puzzle.regions[0].labels.push({ x: 50, y: 60, r: 3 });
    const board = makeBoard(puzzle);
    expect([board.labelX[0], board.labelY[0]]).toEqual([1, 2]);
  });

  it("matches a committed puzzle: every area counted once, under its own colour", () => {
    const { puzzle, board } = REAL;
    expect(board.regions).toBe(puzzle.regions.length);
    expect(board.regions).toBe(REAL.entry.areas);
    expect(board.colours).toBe(puzzle.palette.length);
    expect(board.total.reduce((sum, n) => sum + n, 0)).toBe(board.regions);
    expect(board.area.reduce((sum, n) => sum + n, 0)).toBe(puzzle.width * puzzle.height);
    puzzle.regions.forEach((region, i) => {
      expect(board.colourOf[i]).toBe(region.colour);
      expect(board.labelX[i]).toBeCloseTo(region.labels[0].x, 3);
      expect(board.labelY[i]).toBeCloseTo(region.labels[0].y, 3);
    });
  });

  it("refuses an area with no label or no colour of the palette's", () => {
    const unlabelled = handMade([[0, 10, 1, 1]], 1);
    unlabelled.regions[0].labels = [];
    expect(() => makeBoard(unlabelled)).toThrow(/label/);
    expect(() => makeBoard(handMade([[1, 10, 1, 1]], 1))).toThrow(/colour/);
  });

  it("holds 256 colours, the most a Uint8Array can name, and refuses a 257th", () => {
    const board = makeBoard(handMade([[255, 10, 1, 1]], 256));
    expect(board.colourOf[0]).toBe(255);
    expect(board.total[255]).toBe(1);
    expect(() => makeBoard(handMade([], 257))).toThrow(/colours/);
  });

  it("holds 65,536 areas, the most a save's Uint16 indices can name, and refuses one more", () => {
    const puzzle = handMade(
      Array.from({ length: 0x10000 }, (_, i) => [0, 1, i % 256, i >> 8] as [number, number, number, number]),
      1,
    );
    const board = makeBoard(puzzle);
    const s = play(fresh(board), board, tap(0xffff), tap(0));
    expect(parseSaved(toSaved(s), board, handExpected)?.order).toEqual([0xffff, 0]);
    puzzle.regions.push({ colour: 0, area: 1, box: [0, 0, 1, 1], labels: [{ x: 0, y: 0, r: 1 }], rings: [] });
    expect(() => makeBoard(puzzle)).toThrow(/save/);
  });
});

describe("newGame", () => {
  it("starts blank, on colour 0, with the magnifiers it is given", () => {
    const s = newGame(BOARD, "butterfly", "hard", "abc123", 5);
    expect(s).toMatchObject({ version: 1, picture: "butterfly", level: "hard", puzzle: "abc123", order: [], auto: 0, selected: 0, magnifiers: 5, elapsed: 0, done: false });
    expect(s.painted).toHaveLength(8);
    expect([...s.painted].every((p) => p === 0)).toBe(true);
  });

  it("calls a board with no areas finished from the start", () => {
    expect(newGame(makeBoard(handMade([], 1)), "x", "easy", "x", 3).done).toBe(true);
  });
});

describe("reduce: painting", () => {
  it("paints an open area of the selected colour, and records it in order", () => {
    const s0 = fresh(BOARD);
    const s1 = play(s0, BOARD, tap(2));
    expect(s1.order).toEqual([2]);
    expect(s1.painted[2]).toBe(1);
    expect(s1.auto).toBe(0);
    expect(s1.done).toBe(false);
    const s2 = play(s1, BOARD, tap(0));
    expect(s2.order).toEqual([2, 0]);
    expect([...s2.painted]).toEqual([1, 0, 1, 0, 0, 0, 0, 0]);
  });

  it("never changes the state it was given", () => {
    const s0 = fresh(BOARD);
    const s1 = play(s0, BOARD, tap(0));
    expect(s0.order).toEqual([]);
    expect(s0.painted[0]).toBe(0);
    play(s1, BOARD, tap(2));
    expect(s1.order).toEqual([0]);
    expect(s1.painted[2]).toBe(0);
  });

  it("never changes the state it was given, whatever the action", () => {
    const s = play(fresh(BOARD), BOARD, tap(0), { type: "tick", ms: 50 });
    const before = structuredClone(s);
    const actions: Action[] = [pick(1), tap(2), tap(1), brush(5), { type: "magnify" }, { type: "tick", ms: 10 }, { type: "restart", magnifiers: 4 }];
    for (const action of actions) {
      reduce(s, action, BOARD);
      expect(s, action.type).toEqual(before);
    }
  });

  it("refuses a tap on another colour's area: the very same state comes back", () => {
    const s0 = fresh(BOARD);
    for (const area of [1, 3, 5, 7]) expect(reduce(s0, tap(area), BOARD)).toBe(s0);
  });

  it("refuses a painted area, from a tap or from auto-paint", () => {
    const s1 = play(fresh(BOARD), BOARD, tap(0));
    expect(reduce(s1, tap(0), BOARD)).toBe(s1);
    expect(reduce(s1, brush(0), BOARD)).toBe(s1);
  });

  it("refuses an area that isn't one", () => {
    const s0 = fresh(BOARD);
    for (const area of [-1, 8, 1000, 0.5, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(reduce(s0, tap(area), BOARD)).toBe(s0);
      expect(reduce(s0, brush(area), BOARD)).toBe(s0);
    }
  });

  it("lets auto-paint paint any open area, select its colour and count it", () => {
    const s0 = fresh(BOARD);
    const s1 = play(s0, BOARD, brush(5));
    expect(s1.order).toEqual([5]);
    expect(s1.selected).toBe(1);
    expect(s1.auto).toBe(1);
    const s2 = play(s1, BOARD, tap(1), brush(7));
    expect(s2.order).toEqual([5, 1, 7]);
    expect(s2.selected).toBe(3);
    expect(s2.auto).toBe(2);
  });

  it("is done when the last area is painted, and the clock stops", () => {
    let s = play(fresh(BOARD), BOARD, { type: "tick", ms: 1200 });
    s = paint(s, BOARD, [0, 1, 2, 3, 4, 5, 6]);
    expect(s.done).toBe(false);
    s = paint(s, BOARD, [7]);
    expect(s.done).toBe(true);
    expect(s.order).toHaveLength(8);
    expect(reduce(s, { type: "tick", ms: 500 }, BOARD)).toBe(s);
    expect(s.elapsed).toBe(1200);
  });

  it("finishes a committed puzzle, colour by colour, with taps alone", () => {
    const { board } = REAL;
    let s = realGame();
    for (let colour = 0; colour < board.colours; colour++) {
      s = play(s, board, pick(colour));
      for (const area of openAreas(s, board, colour)) s = play(s, board, tap(area));
      expect(isColourDone(s, board, colour)).toBe(true);
    }
    expect(s.done).toBe(true);
    expect(s.auto).toBe(0);
    expect([...colourProgress(s, board)]).toEqual([...board.total]);
  });
});

describe("reduce: the palette, the magnifier, the clock and restart", () => {
  it("selects a colour of the palette and ignores anything else", () => {
    const s0 = fresh(BOARD);
    expect(play(s0, BOARD, pick(3)).selected).toBe(3);
    expect(reduce(s0, pick(0), BOARD)).toBe(s0);
    for (const colour of [-1, 4, 2.5, Number.NaN]) expect(reduce(s0, pick(colour), BOARD)).toBe(s0);
  });

  it("spends one magnifier use at a time and never goes below none", () => {
    let s = fresh(BOARD);
    s = play(s, BOARD, { type: "magnify" }, { type: "magnify" });
    expect(s.magnifiers).toBe(1);
    s = play(s, BOARD, { type: "magnify" });
    expect(s.magnifiers).toBe(0);
    expect(reduce(s, { type: "magnify" }, BOARD)).toBe(s);
  });

  it("adds time while painting and ignores nothing, negatives and junk", () => {
    const s0 = fresh(BOARD);
    const s1 = play(s0, BOARD, { type: "tick", ms: 250 }, { type: "tick", ms: 16.5 });
    expect(s1.elapsed).toBe(266.5);
    for (const ms of [0, -10, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) expect(reduce(s1, { type: "tick", ms }, BOARD)).toBe(s1);
  });

  it("restarts the same picture, level and puzzle blank, with the magnifiers it is given", () => {
    let s = play(fresh(BOARD), BOARD, { type: "tick", ms: 900 }, { type: "magnify" }, brush(5), tap(1));
    s = reduce(s, { type: "restart", magnifiers: 4 }, BOARD);
    expect(s).toMatchObject({ picture: "hand", level: "easy", puzzle: "hand", order: [], auto: 0, selected: 0, magnifiers: 4, elapsed: 0, done: false });
    expect([...s.painted].every((p) => p === 0)).toBe(true);
    // Restarting a blank game with the same magnifiers changes nothing.
    expect(reduce(s, { type: "restart", magnifiers: 4 }, BOARD)).toBe(s);
    expect(reduce(s, { type: "restart", magnifiers: 3 }, BOARD).magnifiers).toBe(3);
  });

  it("restarts a finished painting, its clock running and its areas open again", () => {
    const done = play(paint(fresh(BOARD), BOARD, [0, 1, 2, 3, 4, 5, 6, 7]), BOARD, { type: "magnify" });
    const s = reduce(done, { type: "restart", magnifiers: 3 }, BOARD);
    expect(s.done).toBe(false);
    expect(s.order).toEqual([]);
    expect(s.magnifiers).toBe(3);
    expect(play(s, BOARD, { type: "tick", ms: 100 }).elapsed).toBe(100);
    expect(play(s, BOARD, tap(0)).order).toEqual([0]);
  });
});

describe("selectors", () => {
  it("counts each colour's painted areas", () => {
    const s = paint(fresh(BOARD), BOARD, [0, 4, 5, 7]);
    expect([...colourProgress(s, BOARD)]).toEqual([2, 1, 0, 1]);
    expect(colourProgress(fresh(BOARD), BOARD)).toEqual(new Int32Array(4));
  });

  it("calls a colour done when all its areas are painted, and never one the palette lacks", () => {
    const s = paint(fresh(BOARD), BOARD, [3, 7, 0, 2, 4]);
    expect([0, 1, 2, 3].map((c) => isColourDone(s, BOARD, c))).toEqual([false, false, true, true]);
    expect(isColourDone(paint(s, BOARD, [6]), BOARD, 0)).toBe(true);
    for (const colour of [-1, 4, 0.5]) expect(isColourDone(s, BOARD, colour)).toBe(false);
  });

  it("calls a colour with no areas done", () => {
    const board = makeBoard(handMade([[0, 10, 1, 1]], 2));
    expect(isColourDone(fresh(board), board, 1)).toBe(true);
  });

  it("finds the next unfinished colour after `from`, wrapping round, with `from` itself last", () => {
    const s0 = fresh(BOARD);
    expect(nextColour(s0, BOARD, 0)).toBe(1);
    expect(nextColour(s0, BOARD, 3)).toBe(0);
    // Colours 1 and 2 finished: from 0 skips both.
    const s1 = paint(s0, BOARD, [1, 5, 3]);
    expect(nextColour(s1, BOARD, 0)).toBe(3);
    expect(nextColour(s1, BOARD, 3)).toBe(0);
    expect(nextColour(s1, BOARD, 1)).toBe(3);
    // Only colour 0 left: from 0 comes back round to it.
    const s2 = paint(s1, BOARD, [7]);
    expect(nextColour(s2, BOARD, 0)).toBe(0);
    expect(nextColour(s2, BOARD, 2)).toBe(0);
    // -1 asks for the first unfinished colour of all.
    expect(nextColour(s0, BOARD, -1)).toBe(0);
    expect(nextColour(s1, BOARD, -1)).toBe(0);
  });

  it("passes over a colour that has no areas, as if it were done", () => {
    const board = makeBoard(handMade([[0, 10, 1, 1], [2, 10, 5, 5]], 3));
    expect(nextColour(fresh(board), board, 0)).toBe(2);
    expect(nextColour(fresh(board), board, 2)).toBe(0);
  });

  it("finds no next colour once every colour is done", () => {
    const s = paint(fresh(BOARD), BOARD, [0, 1, 2, 3, 4, 5, 6, 7]);
    for (const from of [-1, 0, 1, 2, 3]) expect(nextColour(s, BOARD, from)).toBe(-1);
    const empty = makeBoard(handMade([], 0));
    expect(nextColour(newGame(empty, "x", "easy", "x", 3), empty, 0)).toBe(-1);
  });

  it("lists a colour's unpainted areas, lowest index first", () => {
    const s0 = fresh(BOARD);
    expect(openAreas(s0, BOARD, 0)).toEqual([0, 2, 4, 6]);
    expect(openAreas(s0, BOARD, 1)).toEqual([1, 5]);
    const s1 = paint(s0, BOARD, [4, 1]);
    expect(openAreas(s1, BOARD, 0)).toEqual([0, 2, 6]);
    expect(openAreas(s1, BOARD, 1)).toEqual([5]);
    expect(openAreas(s1, BOARD, 9)).toEqual([]);
  });
});

describe("magnifierTarget", () => {
  // Sizes 50, 30, 30, 30, 30; areas 2, 3 and 4 are all 10 from the centre (0, 0), area 1 is 100 off.
  const board = makeBoard(
    handMade(
      [
        [0, 50, 0, 0],
        [0, 30, 100, 0],
        [0, 30, 10, 0],
        [0, 30, 0, 10],
        [0, 30, -10, 0],
      ],
      1,
    ),
  );
  const centre = { x: 0, y: 0 };

  it("picks the smallest area, however far off", () => {
    expect(magnifierTarget([0, 1], board, centre)).toBe(1);
    expect(magnifierTarget([0], board, centre)).toBe(0);
  });

  it("breaks a tie on size by the number nearest the centre", () => {
    expect(magnifierTarget([1, 4, 0], board, centre)).toBe(4);
    expect(magnifierTarget([1, 2], board, { x: 100, y: 1 })).toBe(1);
  });

  it("breaks a tie on size and distance by the lower index, whatever the candidates' order", () => {
    expect(magnifierTarget([4, 3, 1, 2, 0], board, centre)).toBe(2);
    expect(magnifierTarget([4, 3], board, centre)).toBe(3);
  });

  it("is -1 with no candidates, and skips any that aren't areas", () => {
    expect(magnifierTarget([], board, centre)).toBe(-1);
    expect(magnifierTarget([-1, 5, 0.5, Number.NaN], board, centre)).toBe(-1);
    expect(magnifierTarget([-1, 5, 0], board, centre)).toBe(0);
  });

  it("finds the smallest open area of a colour in a committed puzzle", () => {
    const { board: real } = REAL;
    const open = openAreas(realGame(), real, 0);
    const target = magnifierTarget(open, real, { x: 400, y: 266 });
    expect(open).toContain(target);
    expect(real.area[target]).toBe(Math.min(...open.map((a) => real.area[a])));
  });
});

describe("autoPlan", () => {
  it("chains each colour by nearest number from `start`, ties to the lower index", () => {
    const plan = autoPlan(fresh(BOARD), BOARD, { x: 12, y: 0 });
    // Colour 0: 4 (2 away), then 0 and 2 both 10 away (0 wins), then 2, then 6. Colour 1: from
    // (12, 0), 1 is nearer than 5. Then 3, then 7.
    expect(plan).toEqual([4, 0, 2, 6, 1, 5, 3, 7]);
  });

  it("starts each colour's chain from `start` again", () => {
    // From (70, 0) colour 0's chain runs 6, 2, 4, 0 and ends at (0, 0), next to 1 (10, 10). Colour 1
    // starts from (70, 0) again, so 5 (40, 10) comes first.
    const plan = autoPlan(fresh(BOARD), BOARD, { x: 70, y: 0 });
    expect(plan.slice(0, 4)).toEqual([6, 2, 4, 0]);
    expect(plan.slice(4, 6)).toEqual([5, 1]);
  });

  it("goes colour by colour from the selected one, wrapping round, and skips painted areas", () => {
    const s = paint(fresh(BOARD), BOARD, [4, 5]);
    const plan = autoPlan(play(s, BOARD, pick(2)), BOARD, { x: 12, y: 0 });
    expect(plan.map((a) => BOARD.colourOf[a])).toEqual([2, 3, 0, 0, 0, 1]);
    expect(plan).toEqual([3, 7, 2, 0, 6, 1]);
  });

  it("is empty when everything is painted", () => {
    expect(autoPlan(paint(fresh(BOARD), BOARD, [0, 1, 2, 3, 4, 5, 6, 7]), BOARD, { x: 0, y: 0 })).toEqual([]);
  });

  describe("on a committed puzzle, part painted", () => {
    const { board } = REAL;
    const start = { x: 400, y: 266 };
    // A player's start: every third area of colours 0 to 4, then colour 7 selected.
    const before = (() => {
      let s = realGame();
      for (let a = 0; a < board.regions; a += 3) if (board.colourOf[a] < 5) s = play(s, board, pick(board.colourOf[a]), tap(a));
      return play(s, board, pick(7));
    })();
    const plan = autoPlan(before, board, start);

    it("covers every open area exactly once", () => {
      expect(new Set(plan).size).toBe(plan.length);
      expect(plan.length).toBe(board.regions - before.order.length);
      for (const a of plan) expect(before.painted[a]).toBe(0);
    });

    it("runs its colours in number order from the selected one", () => {
      const colours = plan.map((a) => board.colourOf[a]).filter((c, i, all) => i === 0 || all[i - 1] !== c);
      const expected = Array.from({ length: board.colours }, (_, k) => (7 + k) % board.colours).filter((c) => openAreas(before, board, c).length > 0);
      expect(colours).toEqual(expected);
    });

    it("always hops to the nearest open number of the colour", () => {
      const d2 = (a: number, x: number, y: number) => (board.labelX[a] - x) ** 2 + (board.labelY[a] - y) ** 2;
      const left = new Set(plan);
      plan.forEach((a, i) => {
        const fromStart = i === 0 || board.colourOf[plan[i - 1]] !== board.colourOf[a];
        const x = fromStart ? start.x : board.labelX[plan[i - 1]];
        const y = fromStart ? start.y : board.labelY[plan[i - 1]];
        let nearest = Number.POSITIVE_INFINITY;
        for (const b of left) if (board.colourOf[b] === board.colourOf[a]) nearest = Math.min(nearest, d2(b, x, y));
        expect(d2(a, x, y), `step ${i}`).toBe(nearest);
        left.delete(a);
      });
    });

    it("finishes the painting when played through the reducer, its palette following along", () => {
      let s = before;
      for (const a of plan) {
        s = play(s, board, brush(a));
        expect(s.selected).toBe(board.colourOf[a]);
      }
      expect(s.done).toBe(true);
      expect(s.auto).toBe(plan.length);
      expect(s.order.slice(before.order.length)).toEqual(plan);
    });
  });
});

describe("saving", () => {
  /** Little-endian Uint16s from base64, read independently of the module's own decoder. */
  const uint16s = (text: string) => {
    const bytes = Buffer.from(text, "base64");
    return Array.from({ length: bytes.length / 2 }, (_, i) => bytes.readUInt16LE(i * 2));
  };

  it("writes the fill order as base64 of little-endian Uint16 area indices", () => {
    const s = play(paint(fresh(BOARD), BOARD, [6, 0, 1]), BOARD, { type: "tick", ms: 4321 }, { type: "magnify" }, brush(7));
    const saved = toSaved(s);
    expect(saved).toEqual({ v: 1, picture: "hand", level: "easy", puzzle: "hand", order: saved.order, auto: 1, selected: 3, magnifiers: 2, elapsed: 4321 });
    expect(uint16s(saved.order)).toEqual([6, 0, 1, 7]);
    expect(toSaved(fresh(BOARD)).order).toBe("");
  });

  it("reads back the same game, through JSON as storage keeps it", () => {
    const s = play(paint(fresh(BOARD), BOARD, [6, 0, 1]), BOARD, { type: "tick", ms: 99.5 }, brush(3), pick(1));
    const back = parseSaved(JSON.parse(JSON.stringify(toSaved(s))), BOARD, handExpected);
    expect(back).toEqual(s);
    expect(parseSaved(toSaved(fresh(BOARD)), BOARD, handExpected)).toEqual(fresh(BOARD));
  });

  it("derives done from the order", () => {
    const done = paint(fresh(BOARD), BOARD, [0, 1, 2, 3, 4, 5, 6, 7]);
    expect(parseSaved(toSaved(done), BOARD, handExpected)?.done).toBe(true);
    expect(parseSaved(toSaved(paint(fresh(BOARD), BOARD, [0])), BOARD, handExpected)?.done).toBe(false);
  });

  it("round-trips a committed puzzle, indices past 255 and all", () => {
    const { board } = REAL;
    let s = realGame();
    const plan = autoPlan(s, board, { x: 0, y: 0 });
    for (const a of plan.slice(0, 40)) s = play(s, board, pick(board.colourOf[a]), tap(a));
    for (const a of plan.slice(40, board.regions - 1)) s = play(s, board, brush(a));
    s = play(s, board, { type: "tick", ms: 60_000 }, { type: "magnify" });
    expect(Math.max(...s.order)).toBeGreaterThan(255);
    const saved = toSaved(s);
    expect(uint16s(saved.order)).toEqual(s.order);
    expect(parseSaved(JSON.parse(JSON.stringify(saved)), board, realExpected)).toEqual(s);
    // The last area painted after the reload finishes it.
    const last = parseSaved(saved, board, realExpected)!;
    expect(play(last, board, brush(plan[plan.length - 1])).done).toBe(true);
  });

  describe("turns away anything but a save of this picture, level and puzzle", () => {
    const good: Saved = toSaved(play(paint(fresh(BOARD), BOARD, [0, 1]), BOARD, brush(3), { type: "tick", ms: 10 }));
    const changed = (patch: Record<string, unknown>) => ({ ...good, ...patch });
    const order = (indices: number[]) => {
      const bytes = Buffer.alloc(indices.length * 2);
      indices.forEach((a, i) => bytes.writeUInt16LE(a, i * 2));
      return bytes.toString("base64");
    };

    it("accepts the good one (so each rejection below is down to its one change)", () => {
      expect(parseSaved(good, BOARD, handExpected)).not.toBeNull();
      expect(parseSaved(changed({ order: order([7, 0]) }), BOARD, handExpected)?.order).toEqual([7, 0]);
    });

    it("junk", () => {
      for (const junk of [null, undefined, 0, 1, "", "save", true, [], [good], () => good, {}]) expect(parseSaved(junk, BOARD, handExpected)).toBeNull();
    });

    it("another version", () => {
      for (const v of [0, 2, "1", undefined, null]) expect(parseSaved(changed({ v }), BOARD, handExpected)).toBeNull();
    });

    it("another picture, level or puzzle", () => {
      expect(parseSaved(good, BOARD, { ...handExpected, picture: "berries" })).toBeNull();
      expect(parseSaved(good, BOARD, { ...handExpected, level: "master" })).toBeNull();
      expect(parseSaved(good, BOARD, { ...handExpected, puzzle: "regenerated" })).toBeNull();
      for (const patch of [{ picture: undefined }, { level: "Easy" }, { puzzle: 7 }]) expect(parseSaved(changed(patch), BOARD, handExpected)).toBeNull();
    });

    it("an order that isn't base64 of whole Uint16s", () => {
      for (const o of [undefined, null, 7, [0, 1], "AAE", "AA E=", "A===", "!!!!", "AAEA", Buffer.from([1, 0, 2]).toString("base64")]) {
        expect(parseSaved(changed({ order: o }), BOARD, handExpected)).toBeNull();
      }
    });

    it("an area out of range or painted twice", () => {
      expect(parseSaved(changed({ order: order([0, 8]) }), BOARD, handExpected)).toBeNull();
      expect(parseSaved(changed({ order: order([65535]) }), BOARD, handExpected)).toBeNull();
      expect(parseSaved(changed({ order: order([0, 1, 0]) }), BOARD, handExpected)).toBeNull();
      expect(parseSaved(changed({ order: order([0, 1, 2, 3, 4, 5, 6, 7, 7]), auto: 0 }), BOARD, handExpected)).toBeNull();
    });

    it("a selected colour the palette lacks", () => {
      for (const selected of [-1, 4, 1.5, "1", null, undefined]) expect(parseSaved(changed({ selected }), BOARD, handExpected)).toBeNull();
    });

    it("magnifiers that aren't a whole number from 0 to 99", () => {
      for (const magnifiers of [-1, 100, 2.5, "3", null, undefined, Number.NaN]) expect(parseSaved(changed({ magnifiers }), BOARD, handExpected)).toBeNull();
      expect(parseSaved(changed({ magnifiers: 0 }), BOARD, handExpected)?.magnifiers).toBe(0);
      expect(parseSaved(changed({ magnifiers: 99 }), BOARD, handExpected)?.magnifiers).toBe(99);
    });

    it("an auto-painted count that isn't a whole number from 0 to the order's length", () => {
      // The good save's order is three areas long.
      for (const auto of [-1, 4, 0.5, "1", null, undefined]) expect(parseSaved(changed({ auto }), BOARD, handExpected)).toBeNull();
      expect(parseSaved(changed({ auto: 3 }), BOARD, handExpected)?.auto).toBe(3);
      expect(parseSaved(changed({ auto: 0 }), BOARD, handExpected)?.auto).toBe(0);
    });

    it("time that isn't a finite number of milliseconds, 0 or more", () => {
      for (const elapsed of [-1, Number.NaN, Number.POSITIVE_INFINITY, "10", null, undefined]) expect(parseSaved(changed({ elapsed }), BOARD, handExpected)).toBeNull();
      expect(parseSaved(changed({ elapsed: 0 }), BOARD, handExpected)?.elapsed).toBe(0);
    });
  });
});
