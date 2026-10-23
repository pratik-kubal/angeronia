import { describe, expect, it } from "vitest";
import { newGame, reduce, type GameState, type Move } from "../game";
import type { Difficulty } from "../generate";
import { BOXES, colOf, rowOf } from "../grid";
import { mulberry32 } from "../../random";
import { RECENT_MOVES, THEMES, THEME_LIST, secretsAt, type Moment, type SecretDef, type ThemeDef } from ".";

// A secret is found by curiosity, never by habit. Every theme's play secrets are tried against
// seeded games played the ways people really play (at random, row by row, from the bottom up,
// column by column, box by box, one digit at a time, cycling the pad up or down), with refused
// digits and hints sprinkled in, on an ordinary afternoon in the theme's season. None may be met
// in more than a few of those games.

type Strategy = (state: GameState, rng: () => number) => number[];

const empties = (s: GameState) => s.grid.flatMap((d, i) => (d ? [] : [i]));
/** One cell per digit, cycling through `digits` until the board is full. */
const cycle = (digits: number[]) => (s: GameState) => {
  const left = new Set(empties(s));
  const order: number[] = [];
  while (left.size) {
    for (const d of digits) {
      const cell = [...left].find((i) => s.solution[i] === d);
      if (cell === undefined) continue;
      order.push(cell);
      left.delete(cell);
    }
  }
  return order;
};

const STRATEGIES: Record<string, Strategy> = {
  random: (s, rng) => empties(s).sort(() => rng() - 0.5),
  reading: (s) => empties(s),
  "bottom up": (s) => empties(s).reverse(),
  columns: (s) => empties(s).sort((a, b) => colOf(a) - colOf(b) || rowOf(a) - rowOf(b)),
  boxes: (s) => BOXES.flatMap((box) => box.cells.filter((i) => !s.grid[i])),
  "digit by digit": (s) => empties(s).sort((a, b) => s.solution[a] - s.solution[b] || a - b),
  "pad up": cycle([1, 2, 3, 4, 5, 6, 7, 8, 9]),
  "pad down": cycle([9, 8, 7, 6, 5, 4, 3, 2, 1]),
};

const GAMES = 30;
const DIFFICULTIES: Difficulty[] = ["easy", "medium"];
/** At most this share of one style's games may meet a secret by accident. */
const MAX_RATE = 0.05;

/** An ordinary afternoon well inside the theme's season (Aurora: a September day). */
const afternoon = (t: ThemeDef) => (t.season ? new Date(2026, t.season.from[0] - 1, t.season.from[1] + 9, 14, 7) : new Date(2026, 8, 10, 14, 7));

/** Plays one game in the style, returning the ids of the theme's secrets it met. */
function play(theme: ThemeDef, strategy: Strategy, difficulty: Difficulty, seed: number): Set<string> {
  const rng = mulberry32(seed * 7919 + 13);
  const now = afternoon(theme);
  const met = new Set<string>();
  const recent: Move[] = [];
  const check = (moment: Moment) => secretsAt(theme.id, { moment, now, recent }).forEach((s) => met.add(s.id));
  let state = newGame(difficulty, seed);
  check({ kind: "deal", state });
  for (const cell of strategy(state, rng)) {
    if (state.grid[cell]) continue;
    state = reduce(state, { type: "select", cell });
    const moves: Move[] = [];
    if (rng() < 0.15) {
      state = reduce(state, { type: "digit", digit: (state.solution[cell] % 9) + 1 });
      moves.push(state.last!);
    }
    state = rng() < 0.04 && state.hintsLeft ? reduce(state, { type: "hint" }) : reduce(state, { type: "digit", digit: state.solution[cell] });
    moves.push(state.last!);
    for (const move of moves) {
      recent.push(move);
      if (recent.length > RECENT_MOVES) recent.shift();
      check({ kind: "move", state, move });
    }
    if (state.status === "won") check({ kind: "win", state });
  }
  expect(state.status).toBe("won");
  return met;
}

/** Secrets that play listens for (a tap or a wait is never met by placing digits). */
const playSecrets = (t: ThemeDef): SecretDef[] => t.secrets.filter((s) => s.on.some((k) => k === "deal" || k === "move" || k === "win"));

describe.each(THEME_LIST.filter((t) => playSecrets(t).length).map((t) => [t.id, t] as const))("%s", (_, theme) => {
  it.each(Object.keys(STRATEGIES))("no secret is met by habit, playing %s", (name) => {
    const hits = new Map<string, number>();
    for (const difficulty of DIFFICULTIES) {
      for (let g = 0; g < GAMES; g++) {
        for (const id of play(theme, STRATEGIES[name], difficulty, 1000 + g + (difficulty === "medium" ? 500 : 0))) hits.set(id, (hits.get(id) ?? 0) + 1);
      }
    }
    const total = GAMES * DIFFICULTIES.length;
    for (const secret of playSecrets(theme)) {
      expect((hits.get(secret.id) ?? 0) / total, `${secret.id} (${hits.get(secret.id) ?? 0} of ${total} games)`).toBeLessThanOrEqual(MAX_RATE);
    }
  });
});

// The check above must be able to fail: a secret met whenever a box is finished is met in every game.
it("notices a secret that habit meets", () => {
  const saved = THEMES.aurora;
  const habit: SecretDef = {
    ...saved.secrets[0],
    id: "habit",
    on: ["move"],
    test: (c) => c.moment.kind === "move" && c.moment.move.kind !== "miss" && c.moment.move.units.some((u) => u.kind === "box"),
  };
  THEMES.aurora = { ...saved, secrets: [habit] };
  try {
    expect([...play(THEMES.aurora, STRATEGIES.reading, "easy", 1)]).toEqual(["habit"]);
  } finally {
    THEMES.aurora = saved;
  }
});
