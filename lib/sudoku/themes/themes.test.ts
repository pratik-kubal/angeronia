import { describe, expect, it } from "vitest";
import { newGame, reduce, type GameState } from "../game";
import {
  SEASON_TABLE,
  THEMES,
  THEME_IDS,
  THEME_LIST,
  formatSeason,
  inSeason,
  isThemeChoice,
  resolveTheme,
  secretsAt,
  seasonalTheme,
  type Moment,
  type MomentKind,
  type SecretDef,
  type ThemeDef,
  type ThemeId,
} from ".";

const KINDS: readonly MomentKind[] = ["deal", "move", "win", "emblem", "scene", "idle"];
const graphemes = (s: string) => [...new Intl.Segmenter("en", { granularity: "grapheme" }).segment(s)].length;
const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const HEX = /^#[0-9a-f]{6}$/i;
/** The themes of no season: Aurora (Seasonal's fallback) and Candy, only ever picked from the list. */
const ALL_YEAR: readonly ThemeId[] = ["aurora", "candy"];
/** A local date: month 1–12. */
const on = (month: number, day: number, hour = 14) => new Date(2026, month - 1, day, hour, 7);

describe("the theme registry", () => {
  it("defines every theme id once, under its own id", () => {
    expect(Object.keys(THEMES).sort()).toEqual([...THEME_IDS].sort());
    for (const id of THEME_IDS) expect(THEMES[id].id).toBe(id);
    expect(THEME_LIST.map((t) => t.id)).toEqual([...THEME_IDS]);
  });

  it.each(THEME_LIST.map((t) => [t.id, t] as const))("%s: its copy and look fit the picker", (_, t: ThemeDef) => {
    expect(t.name.length).toBeLessThanOrEqual(16);
    expect(t.blurb.length).toBeLessThanOrEqual(60);
    expect(t.blurb).toMatch(/\.$/);
    expect(t.solved.length).toBeLessThanOrEqual(18);
    expect(t.arrival.length).toBeLessThanOrEqual(60);
    expect(t.arrival).toMatch(/[.!]$/);
    expect(graphemes(t.emoji)).toBe(1);
    if (t.emblem !== null) expect(graphemes(t.emblem)).toBe(1);
    expect(t.sparks.length).toBeLessThanOrEqual(8);
    for (const spark of t.sparks) expect(graphemes(spark)).toBe(1);
    for (const scheme of ["light", "dark"] as const) {
      expect(t.swatch[scheme]).toHaveLength(3);
      for (const colour of t.swatch[scheme]) expect(colour).toMatch(HEX);
    }
  });

  it("gives every theme but the all-year ones a season, each a real span of days", () => {
    for (const t of THEME_LIST) {
      if (ALL_YEAR.includes(t.id)) {
        expect(t.season).toBeNull();
        continue;
      }
      expect(t.season).not.toBeNull();
      for (const [month, day] of [t.season!.from, t.season!.to]) {
        expect(month).toBeGreaterThanOrEqual(1);
        expect(month).toBeLessThanOrEqual(12);
        expect(day).toBeGreaterThanOrEqual(1);
        expect(day).toBeLessThanOrEqual(new Date(2028, month, 0).getDate());
      }
    }
  });
});

describe("the calendar", () => {
  it("never has two themes in season on the same day (a leap year, every day)", () => {
    for (let d = new Date(2028, 0, 1); d.getFullYear() === 2028; d.setDate(d.getDate() + 1)) {
      const open = THEME_LIST.filter((t) => t.season && inSeason(t.season, d));
      expect(open.length, d.toDateString()).toBeLessThanOrEqual(1);
    }
  });

  it.each([
    [9, 30, 14, "aurora"],
    [10, 1, 14, "halloween"],
    [10, 22, 14, "halloween"],
    [10, 31, 23, "halloween"],
    [11, 2, 14, "halloween"],
    [11, 3, 14, "aurora"],
    [11, 30, 14, "aurora"],
    [12, 1, 14, "snow"],
    [12, 25, 14, "snow"],
    [1, 1, 0, "snow"],
    [1, 31, 14, "snow"],
    [2, 1, 14, "aurora"],
    [2, 29, 14, "aurora"],
    [3, 19, 14, "aurora"],
    [3, 20, 14, "blossom"],
    [5, 15, 14, "blossom"],
    [5, 16, 14, "aurora"],
    [5, 31, 14, "aurora"],
    [6, 1, 14, "beach"],
    [7, 4, 14, "beach"],
    [8, 31, 14, "beach"],
    [9, 1, 14, "aurora"],
  ] as const)("on %i/%i at %i:07 Seasonal shows %s", (month, day, hour, id) => {
    expect(seasonalTheme(on(month, day, hour))).toBe(id);
    expect(resolveTheme("seasonal", on(month, day, hour))).toBe(id);
  });

  it("keeps a chosen theme whatever the date", () => {
    for (const id of THEME_IDS) expect(resolveTheme(id, on(10, 31))).toBe(id);
  });

  it("lists the seasons for the pre-paint script as day keys", () => {
    expect(SEASON_TABLE).toEqual([
      ["beach", 601, 831],
      ["halloween", 1001, 1102],
      ["snow", 1201, 131],
      ["blossom", 320, 515],
    ]);
  });

  it("formats a season for the picker", () => {
    expect(formatSeason(THEMES.halloween.season)).toBe("Oct 1 – Nov 2");
    expect(formatSeason(THEMES.snow.season)).toBe("Dec 1 – Jan 31");
    expect(formatSeason(null)).toBe("All year");
  });

  it("knows a theme choice when it sees one", () => {
    expect(isThemeChoice("seasonal")).toBe(true);
    for (const id of THEME_IDS) expect(isThemeChoice(id)).toBe(true);
    for (const junk of ["Seasonal", "", null, undefined, 3, {}]) expect(isThemeChoice(junk)).toBe(false);
  });
});

describe("secrets", () => {
  it.each(THEME_LIST.map((t) => [t.id, t] as const))("%s hides three, each with a riddle, a find and a surprise", (_, t: ThemeDef) => {
    expect(t.secrets).toHaveLength(3);
    expect(new Set(t.secrets.map((s) => s.id)).size).toBe(3);
    expect(new Set(t.secrets.map((s) => s.name)).size).toBe(3);
    for (const s of t.secrets) {
      expect(s.id).toMatch(KEBAB);
      expect(s.name.length).toBeLessThanOrEqual(24);
      expect(s.riddle.length).toBeLessThanOrEqual(70);
      expect(s.riddle).toMatch(/\.$/);
      expect(s.found.length).toBeLessThanOrEqual(70);
      expect(s.found).toMatch(/[.!]$/);
      expect(graphemes(s.emoji)).toBe(1);
      expect(s.on.length).toBeGreaterThan(0);
      for (const kind of s.on) expect(KINDS).toContain(kind);
      expect(s.surprise).toMatch(KEBAB);
      // "arrive" is the season's own surprise.
      expect(s.surprise).not.toBe("arrive");
    }
  });

  // Every moment can happen on a phone, but a scene piece may not show on every screen: a secret
  // that listens for a scene tap also listens for something else.
  it.each(THEME_LIST.map((t) => [t.id, t] as const))("%s: every one can be found on a phone", (_, t: ThemeDef) => {
    for (const s of t.secrets) expect(s.on.some((kind) => kind !== "scene"), s.id).toBe(true);
  });

  // An ordinary afternoon in the theme's season: dealing, one plain placement and a single tap on
  // the title find nothing (a secret is never met by just playing).
  it.each(THEME_LIST.map((t) => [t.id, t] as const))("%s: none is met by just starting to play", (_, t: ThemeDef) => {
    const day = t.season ? new Date(2026, t.season.from[0] - 1, t.season.from[1] + 9, 14, 7) : on(9, 10);
    const game: GameState = newGame("easy", 12345);
    const cell = game.grid.findIndex((d, i) => !d && game.solution[i] !== 9);
    const played = reduce(reduce(game, { type: "select", cell }), { type: "digit", digit: game.solution[cell] });
    const moments: Moment[] = [
      { kind: "deal", state: game },
      { kind: "move", state: played, move: played.last! },
      { kind: "emblem", taps: 1 },
    ];
    expect(played.last?.kind).toBe("place");
    for (const moment of moments) {
      const recent = moment.kind === "move" ? [moment.move] : [];
      expect(secretsAt(t.id, { moment, now: day, recent }).map((s) => s.id), moment.kind).toEqual([]);
    }
  });

  it("asks a secret only about the moments it listens for, and one that throws is not met", () => {
    const saved = THEMES.aurora;
    const asked: MomentKind[] = [];
    const secret = (id: string, test: SecretDef["test"]): SecretDef => ({
      id,
      name: id,
      emoji: "✨",
      riddle: "A riddle.",
      found: "Found.",
      on: ["emblem", "idle"],
      test,
      surprise: "sparkle",
    });
    THEMES.aurora = {
      ...saved,
      secrets: [
        secret("listens", (c) => (asked.push(c.moment.kind), true)),
        secret("throws", () => {
          throw new Error("a broken test");
        }),
      ],
    };
    try {
      const met = KINDS.flatMap((kind) => secretsAt("aurora", { moment: { kind } as Moment, now: on(9, 10), recent: [] }));
      expect(asked).toEqual(["emblem", "idle"]);
      expect(met.map((s) => s.id)).toEqual(["listens", "listens"]);
    } finally {
      THEMES.aurora = saved;
    }
  });
});
