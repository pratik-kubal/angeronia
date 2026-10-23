import { afterEach, describe, expect, it, vi } from "vitest";
import { THEME_LIST, resolveTheme } from "@/lib/sudoku/themes";
import { EMBLEM_STYLE, LOOK_SCRIPT, loadSecrets, loadSettings, resolveScheme } from "./storage";

// The pre-paint script must pick exactly the look the game then applies: the same scheme and theme
// for any saved settings (or none, or junk, or blocked storage) on any day of the year.

/** Stubs the browser for `settings` (a raw localStorage value; "throw" makes storage throw) on `date`. */
function browser(raw: string | null | "throw", date: Date, systemDark: boolean) {
  const dataset: Record<string, string> = {};
  const store = new Map<string, string>();
  if (raw !== null && raw !== "throw") store.set("sudoku:settings", raw);
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => {
      if (raw === "throw") throw new Error("blocked");
      return store.get(key) ?? null;
    },
  });
  vi.stubGlobal("matchMedia", (query: string) => ({ matches: query === "(prefers-color-scheme: dark)" && systemDark }));
  vi.stubGlobal("document", { documentElement: { dataset }, querySelectorAll: () => [] });
  vi.stubGlobal("getComputedStyle", () => ({ getPropertyValue: () => "" }));
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(date);
  return dataset;
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const SETTINGS = [
  null,
  "throw",
  "{",
  "null",
  "{}",
  JSON.stringify({ appearance: "dark" }),
  JSON.stringify({ appearance: "light", theme: "aurora" }),
  JSON.stringify({ appearance: "system", theme: "seasonal" }),
  JSON.stringify({ theme: "candy", appearance: "dark" }),
  JSON.stringify({ theme: "beach" }),
  JSON.stringify({ theme: "halloween", appearance: "dark" }),
  JSON.stringify({ theme: "snow" }),
  JSON.stringify({ theme: "blossom" }),
  JSON.stringify({ theme: "Beach" }),
  JSON.stringify({ theme: 7, appearance: "sepia" }),
];

/** Every fifth day of a leap year, plus the days either side of each season's ends. */
const DAYS = [
  ...Array.from({ length: 74 }, (_, k) => new Date(2028, 0, 1 + k * 5, 9, 30)),
  ...[
    [2, 29],
    [3, 19],
    [3, 20],
    [5, 15],
    [5, 16],
    [5, 31],
    [6, 1],
    [8, 31],
    [9, 1],
    [9, 30],
    [10, 1],
    [11, 2],
    [11, 3],
    [11, 30],
    [12, 1],
    [12, 31],
    [1, 1],
    [1, 31],
    [2, 1],
  ].map(([m, d]) => new Date(2028, m - 1, d, 23, 59)),
];

describe("LOOK_SCRIPT", () => {
  it("picks the scheme and theme the game resolves, for any settings on any day", () => {
    for (const raw of SETTINGS) {
      for (const systemDark of [false, true]) {
        for (const date of DAYS) {
          const dataset = browser(raw, date, systemDark);
          new Function(LOOK_SCRIPT)();
          const settings = loadSettings();
          const label = `${raw} on ${date.toDateString()}${systemDark ? " (system dark)" : ""}`;
          expect(dataset.sdkScheme, label).toBe(resolveScheme(settings.appearance));
          expect(dataset.sdkTheme, label).toBe(resolveTheme(settings.theme, new Date()));
          vi.useRealTimers();
          vi.unstubAllGlobals();
        }
      }
    }
  });

  it("shows Aurora by default whatever the season, and the season's theme once Seasonal is picked", () => {
    const halloween = new Date(2026, 9, 22, 12);
    const dataset = browser(null, halloween, false);
    new Function(LOOK_SCRIPT)();
    expect(dataset).toEqual({ sdkScheme: "light", sdkTheme: "aurora" });
    const seasonal = browser(JSON.stringify({ theme: "seasonal" }), halloween, false);
    new Function(LOOK_SCRIPT)();
    expect(seasonal).toEqual({ sdkScheme: "light", sdkTheme: "halloween" });
  });
});

describe("EMBLEM_STYLE", () => {
  it("draws every theme's emblem in place of the mark, and leaves Aurora's mark alone", () => {
    for (const t of THEME_LIST) {
      const rule = `html[data-sdk-theme="${t.id}"] .sdk-mark::before{content:${JSON.stringify(t.emblem)}}`;
      expect(EMBLEM_STYLE.includes(rule), t.id).toBe(t.emblem !== null);
    }
  });
});

describe("settings and secrets", () => {
  it("defaults the theme to Aurora and keeps a saved one", () => {
    browser(null, new Date(2026, 0, 1), false);
    expect(loadSettings()).toEqual({ sound: true, haptics: true, appearance: "system", theme: "aurora" });
    browser(JSON.stringify({ sound: false, theme: "snow" }), new Date(2026, 0, 1), false);
    expect(loadSettings()).toMatchObject({ sound: false, theme: "snow" });
  });

  it("reads back only secrets of real themes", () => {
    const store = new Map([["sudoku:secrets", JSON.stringify({ beach: ["a", 3, "b"], nowhere: ["c"], snow: "d", halloween: [] })]]);
    vi.stubGlobal("localStorage", { getItem: (key: string) => store.get(key) ?? null });
    expect(loadSecrets()).toEqual({ beach: ["a", "b"], halloween: [] });
  });
});
