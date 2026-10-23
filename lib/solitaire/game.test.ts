import { describe, expect, it } from "vitest";
import { CARDS, cardCode, type Card } from "./cards";
import { DEAL_VERSION, deal, type Table } from "./deal";
import {
  MAX_MOVES,
  PILE_IDS,
  POINTS,
  canFinish,
  finishMoves,
  legalCount,
  newGame,
  parseSaved,
  parseToken,
  reduce,
  replay,
  score,
  toSaved,
  type GameState,
  type PileId,
} from "./game";

const CODES = new Map(CARDS.map((c) => [cardCode(c), c]));
/** Cards by code: "KS QH" → [King of spades, Queen of hearts]. */
const cards = (codes: string): Card[] => (codes ? codes.split(" ").map((c) => CODES.get(c)!) : []);

/** A table from codes; every card not placed doesn't matter to the rules under test. */
function table(spec: { stock?: string; waste?: string; fan?: number; foundations?: string[]; tableau?: [string, string][] }): Table {
  const tableau = Array.from({ length: 7 }, (_, i) => {
    const [down, up] = spec.tableau?.[i] ?? ["", ""];
    return { down: cards(down), up: cards(up) };
  });
  return {
    stock: cards(spec.stock ?? ""),
    waste: cards(spec.waste ?? ""),
    fan: spec.fan ?? 0,
    foundations: (spec.foundations ?? ["", "", "", ""]).map(cards),
    tableau,
  };
}
const at = (t: Table): GameState => ({ ...newGame(1), table: t });
const move = (s: GameState, from: PileId, to: PileId) =>
  reduce(s, { type: "move", from, to, count: legalCount(s.table, from, to) ?? 0 });

/** Every legal move on the table. */
const legalMoves = (t: Table) =>
  PILE_IDS.flatMap((from) => PILE_IDS.flatMap((to) => (legalCount(t, from, to) === null ? [] : [{ from, to }])));

describe("drawing", () => {
  it("turns three from the stock, the third on top, fanned", () => {
    const s0 = newGame(3);
    const s = reduce(s0, { type: "stock" });
    expect(s.table.stock).toEqual(s0.table.stock.slice(0, 21));
    expect(s.table.waste).toEqual(s0.table.stock.slice(21).reverse());
    expect(s.table.fan).toBe(3);
    expect(s.log).toEqual(["s"]);
    expect(s.last?.effects[0].cards).toEqual(s0.table.stock.slice(21).reverse());
  });

  it("turns what's left of a short stock", () => {
    const s = reduce(at(table({ stock: "2C 3C", waste: "4D" })), { type: "stock" });
    expect(s.table.waste.map(cardCode)).toEqual(["4D", "3C", "2C"]);
    expect(s.table.fan).toBe(2);
  });

  it("turns the waste back over in order, so the next pass deals the same threes, at −20 a recycle", () => {
    let s = newGame(11);
    const pass = () => {
      const threes: string[] = [];
      for (let k = 0; k < 8; k++) {
        s = reduce(s, { type: "stock" });
        threes.push(s.table.waste.slice(-3).map(cardCode).join(""));
      }
      return threes;
    };
    const first = pass();
    expect(s.table.stock).toEqual([]);
    s = reduce(s, { type: "stock" });
    expect(s.table.waste).toEqual([]);
    expect(s.table.stock).toHaveLength(24);
    expect(s.last?.effects[0].recycled).toBe(true);
    expect(s.points).toBe(POINTS.recycle);
    expect(pass()).toEqual(first);
    s = reduce(s, { type: "stock" });
    expect(s.points).toBe(2 * POINTS.recycle);
    expect(s.recycles).toBe(2);
  });

  it("does nothing with the stock and the waste both empty", () => {
    const s = at(table({}));
    expect(reduce(s, { type: "stock" })).toBe(s);
  });

  it("closes the fan as its cards are played", () => {
    let s = at(table({ waste: "9C 8D 7S", fan: 3, tableau: [["", "8H"], ["", ""], ["", ""], ["", ""], ["", ""], ["", ""], ["", ""]] }));
    s = move(s, "w", "t0");
    expect(s.table.fan).toBe(2);
    expect(s.table.waste.map(cardCode)).toEqual(["9C", "8D"]);
  });
});

describe("the rules", () => {
  const t = table({
    waste: "QH",
    foundations: ["AH", "", "", ""],
    tableau: [
      ["", "KS"],
      ["5C", "KD QS JH"],
      ["", ""],
      ["3D", "2H"],
      ["", "QC"],
      ["", "TS"],
      ["", "AS"],
    ],
  });

  it("builds down in alternating colours, Kings alone on empty columns", () => {
    expect(legalCount(t, "w", "t0")).toBe(1); // QH on KS
    expect(legalCount(t, "w", "t4")).toBeNull(); // QH on QC
    expect(legalCount(t, "t4", "t2")).toBeNull(); // a Queen to an empty column
    expect(legalCount(t, "t0", "t2")).toBe(1); // a King to an empty column
  });

  it("moves the one part of a run that fits", () => {
    expect(legalCount(t, "t1", "t2")).toBe(3); // KD QS JH to the empty column
    expect(legalCount(t, "t1", "t5")).toBeNull();
    const t2 = table({ tableau: [["", "KS QH JC"], ["", "QD"], ["", ""], ["", ""], ["", ""], ["", ""], ["", ""]] });
    expect(legalCount(t2, "t0", "t1")).toBe(1); // JC onto QD
  });

  it("keeps each foundation to its suit, in order from the Ace", () => {
    expect(legalCount(t, "t3", "f0")).toBe(1); // 2H on AH
    expect(legalCount(t, "t6", "f1")).toBe(1); // AS on the spades
    expect(legalCount(t, "t6", "f0")).toBeNull();
    expect(legalCount(t, "w", "f0")).toBeNull(); // QH on AH
    expect(legalCount(t, "t1", "f0")).toBeNull(); // JH on AH
  });

  it("never moves to the stock or the waste, nor between foundations", () => {
    for (const from of PILE_IDS) {
      expect(legalCount(t, from, "s")).toBeNull();
      expect(legalCount(t, from, "w")).toBeNull();
    }
    expect(legalCount(t, "f0", "f1")).toBeNull();
  });

  it("refuses a move whose count isn't the legal one", () => {
    const s = at(t);
    expect(reduce(s, { type: "move", from: "t1", to: "t2", count: 1 })).toBe(s);
    expect(reduce(s, { type: "move", from: "t4", to: "t2", count: 1 })).toBe(s);
  });
});

describe("moves and points", () => {
  it("turns over the card a move uncovers, for 5", () => {
    let s = at(table({ tableau: [["", "8H"], ["4D 6C", "7S"], ["", ""], ["", ""], ["", ""], ["", ""], ["", ""]] }));
    s = move(s, "t1", "t0");
    expect(s.table.tableau[1]).toEqual({ down: cards("4D"), up: cards("6C") });
    expect(s.table.tableau[0].up.map(cardCode)).toEqual(["8H", "7S"]);
    expect(s.points).toBe(POINTS.flip);
    expect(s.last?.effects[0]).toMatchObject({ token: "t1t0", cards: cards("7S"), flipped: cards("6C")[0] });
  });

  it("scores Windows Standard", () => {
    const base = table({
      waste: "AH 9C",
      foundations: ["", "AS", "", ""],
      tableau: [["", "TD"], ["", "2S"], ["", ""], ["", ""], ["", ""], ["", ""], ["", ""]],
    });
    let s = at(base);
    s = move(s, "w", "t0"); // 9C on TD
    expect(s.points).toBe(5);
    s = move(s, "w", "f0"); // AH up
    expect(s.points).toBe(15);
    s = move(s, "t1", "f1"); // 2S up
    expect(s.points).toBe(25);
    s = move(s, "f0", "t2"); // a foundation card back down only onto a fitting card
    expect(s).toMatchObject({ points: 25 });
    const s2 = move(at(table({ foundations: ["", "", "", "AC 2C 3C 4C 5C 6C 7C 8C"], tableau: [["", "9H"], ["", ""], ["", ""], ["", ""], ["", ""], ["", ""], ["", ""]] })), "f3", "t0");
    expect(s2.points).toBe(POINTS.foundationToTableau);
  });

  it("takes 2 off every 10 s and adds 700,000 ÷ seconds for a win over 30 s, never below 0", () => {
    const s = { ...newGame(1), points: 100, elapsed: 25_000 };
    expect(score(s)).toBe(96);
    expect(score({ ...s, elapsed: 0, points: -40 })).toBe(0);
    expect(score({ ...s, status: "won", elapsed: 100_000 })).toBe(100 - 20 + 7000);
    expect(score({ ...s, status: "won", elapsed: 30_000 })).toBe(100 - 6);
  });
});

describe("the clock, undo and restart", () => {
  it("starts the clock at the first move", () => {
    let s = reduce(newGame(2), { type: "tick", ms: 500 });
    expect(s.elapsed).toBe(0);
    s = reduce(reduce(s, { type: "stock" }), { type: "tick", ms: 500 });
    expect(s.elapsed).toBe(500);
  });

  it("undoes a move back to exactly the state before it, the clock and hints kept", () => {
    let s = newGame(4);
    for (let k = 0; k < 6; k++) s = reduce(s, { type: "stock" });
    const legal = legalMoves(s.table);
    const before = reduce(reduce(s, { type: "tick", ms: 1000 }), { type: "hint" });
    let after = legal.length ? move(before, legal[0].from, legal[0].to) : reduce(before, { type: "stock" });
    after = reduce(after, { type: "tick", ms: 1000 });
    const back = reduce(after, { type: "undo" });
    expect(back.table).toEqual(before.table);
    expect(back.log).toEqual(before.log);
    expect(back.points).toBe(before.points);
    expect(back.elapsed).toBe(2000);
    expect(back.hints).toBe(1);
    expect(back.rev).toBe(after.rev + 1);
    expect(back.last?.kind).toBe("undo");
  });

  it("restarts the deal with the clock and log cleared", () => {
    let s = reduce(newGame(5), { type: "stock" });
    s = reduce(reduce(s, { type: "tick", ms: 9000 }), { type: "mark", counted: true });
    const r = reduce(s, { type: "restart" });
    expect(r.table).toEqual(deal(5));
    expect(r).toMatchObject({ log: [], elapsed: 0, points: 0, counted: true, status: "playing" });
    expect(r.last?.kind).toBe("restart");
  });
});

describe("winning", () => {
  /** Everything up but a few hearts and spades, all face up. */
  const nearly = () =>
    at(
      table({
        foundations: ["AH 2H 3H 4H 5H 6H 7H 8H 9H TH", "AS 2S 3S 4S 5S 6S 7S 8S 9S TS JS", cardsUpTo("D", 13), cardsUpTo("C", 13)],
        tableau: [["", "KH"], ["", "KS QH"], ["", "JH"], ["", "QS"], ["", ""], ["", ""], ["", ""]],
      }),
    );

  it("finishes once all cards are face up, lowest first, and wins", () => {
    const s = nearly();
    expect(canFinish(s.table)).toBe(true);
    expect(finishMoves(s.table)).toEqual(["t2f0", "t1f0", "t3f1", "t0f0", "t1f1"]);
    const won = reduce(s, { type: "finish" });
    expect(won.status).toBe("won");
    expect(won.last?.kind).toBe("finish");
    expect(won.last?.effects).toHaveLength(5);
    expect(won.points).toBe(50);
  });

  it("can't finish with a card face down or in the talon", () => {
    expect(canFinish(newGame(1).table)).toBe(false);
    expect(canFinish(table({ waste: "KH" }))).toBe(false);
  });

  it("stops the clock, takes no more moves and no undo once won", () => {
    const won = reduce(nearly(), { type: "finish" });
    expect(reduce(won, { type: "tick", ms: 1000 })).toBe(won);
    expect(reduce(won, { type: "undo" })).toBe(won);
    expect(reduce(won, { type: "stock" })).toBe(won);
  });
});

function cardsUpTo(suit: string, rank: number) {
  return "A23456789TJQK".slice(0, rank).split("").map((r) => r + suit).join(" ");
}

describe("saving", () => {
  /** A real game a few dozen moves in. */
  function played(seed: number, steps: number) {
    let s = newGame(seed);
    for (let k = 0; k < steps; k++) {
      const legal = legalMoves(s.table).filter((m) => m.from[0] !== "f");
      s = legal.length && k % 3 ? move(s, legal[k % legal.length].from, legal[k % legal.length].to) : reduce(s, { type: "stock" });
    }
    return s;
  }

  it("round-trips through its saved form by replaying the log", () => {
    const s = reduce(reduce(played(9, 40), { type: "tick", ms: 61_000 }), { type: "mark", counted: true });
    const back = parseSaved(JSON.parse(JSON.stringify(toSaved(s))));
    expect(back).not.toBeNull();
    expect(back!.table).toEqual(s.table);
    expect(back).toMatchObject({ seed: 9, log: s.log, points: s.points, elapsed: 61_000, counted: true, rev: s.rev, last: null });
  });

  it("keeps the longest legal run of a log", () => {
    const s = played(9, 30);
    const back = parseSaved({ ...toSaved(s), moves: [...s.log, "t0t0", "s"] });
    expect(back!.log).toEqual(s.log);
    expect(replay(9, [...s.log, "f0t0"]).applied).toBe(s.log.length);
  });

  it("refuses junk, another version or another deal version", () => {
    const good = toSaved(newGame(1));
    for (const bad of [null, 3, "x", {}, { ...good, v: 2 }, { ...good, deal: DEAL_VERSION + 1 }, { ...good, seed: -1 }, { ...good, moves: ["zz"] }, { ...good, counted: "yes" }])
      expect(parseSaved(bad)).toBeNull();
  });

  it("cuts an absurdly long log", () => {
    const back = parseSaved({ ...toSaved(newGame(1)), moves: Array(MAX_MOVES + 50).fill("s") });
    expect(back!.log).toHaveLength(MAX_MOVES);
  });

  it("parses only real tokens", () => {
    expect(parseToken("wt3")).toEqual({ from: "w", to: "t3" });
    expect(parseToken("f0t6")).toEqual({ from: "f0", to: "t6" });
    for (const bad of ["s", "t7f0", "sw", "wf4", "t1w", ""]) expect(parseToken(bad)).toBeNull();
  });
});
