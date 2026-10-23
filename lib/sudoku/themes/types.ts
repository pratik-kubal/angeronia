// Themes: what a theme is, and the moments of play its secrets listen for. Pure (no React, no
// DOM), so the rules are tested in node; each theme's look (its colour tokens, scene and voice)
// lives in components/sudoku/themes/<id>/.

import type { GameState, Move } from "../game";

export const THEME_IDS = ["aurora", "candy", "beach", "halloween", "snow", "blossom"] as const;
export type ThemeId = (typeof THEME_IDS)[number];
/** The setting (Aurora unless the player picks another): one theme, or "seasonal" (the theme whose season the calendar is in, else Aurora). */
export type ThemeChoice = "seasonal" | ThemeId;

/** A month (1–12) and a day of it. */
export type MonthDay = readonly [month: number, day: number];
/** A theme's season, both ends inclusive; a `from` later in the year than `to` wraps the new year. */
export type Season = { from: MonthDay; to: MonthDay };

/**
 * A moment of play a secret can listen for. Every one happens in this tab, by the player's hand:
 * a game loaded from storage or another tab is never a moment. Every one can happen on a phone (a
 * secret never needs a keyboard; a word can be spelled on the pad instead, see keypad.ts).
 * - deal: a new game was dealt.
 * - move: a digit placed, a hint taken or a digit refused (`state` is after it).
 * - win: the board was solved (right after the winning move's own moment).
 * - emblem: the title was tapped; `taps` counts taps in a row, each within EMBLEM_TAP_MS of the last.
 * - scene: a tappable piece of the theme's scene was tapped; `target` names it.
 * - idle: a game under way had no move for `seconds` (one of IDLE_MARKS), the page in view.
 */
export type Moment =
  | { kind: "deal"; state: GameState }
  | { kind: "move"; state: GameState; move: Move }
  | { kind: "win"; state: GameState }
  | { kind: "emblem"; taps: number }
  | { kind: "scene"; target: string }
  | { kind: "idle"; seconds: number; state: GameState };
export type MomentKind = Moment["kind"];

export const EMBLEM_TAP_MS = 700;
export const IDLE_MARKS = [30, 90] as const;
/** How many of this game's moves `recent` keeps. */
export const RECENT_MOVES = 30;

export type SecretContext = {
  moment: Moment;
  /** The player's local time of the moment. */
  now: Date;
  /** This game's moves made in this tab, oldest first, the last RECENT_MOVES of them (the moment's own move included). */
  recent: readonly Move[];
};

/**
 * An easter egg. Its test runs only on the moment kinds in `on`, and finding it plays the
 * scene's `surprise` (every time it is met again, too); the first find is saved and announced.
 */
export type SecretDef = {
  /** Kebab-case, unique within its theme. */
  id: string;
  /** At most 24 characters. */
  name: string;
  /** One emoji (a single grapheme). */
  emoji: string;
  /** The clue shown while it is still hidden: a sentence of at most 70 characters. */
  riddle: string;
  /** The line shown once it is found: a sentence of at most 70 characters. */
  found: string;
  on: readonly MomentKind[];
  test: (c: SecretContext) => boolean;
  /** The surprise the theme's scene plays for it (kebab-case; the scene knows it by this name). */
  surprise: string;
};

export type ThemeDef = {
  id: ThemeId;
  /** At most 16 characters. */
  name: string;
  /** One emoji (a single grapheme): the theme's face in the picker. */
  emoji: string;
  /** One sentence of at most 60 characters. */
  blurb: string;
  /** When Seasonal picks it; null for a theme of no season (Aurora, the fallback, and Candy). */
  season: Season | null;
  /** Three hex colours for the picker's swatch, per scheme. */
  swatch: { light: readonly [string, string, string]; dark: readonly [string, string, string] };
  /** The title's emblem (one emoji), or null for the 3×3 mark. */
  emblem: string | null;
  /** Glyphs (emoji) the win's fireworks mix in with the digits; empty for digits only. */
  sparks: readonly string[];
  /** The result sheet's heading for a solved board: at most 18 characters. */
  solved: string;
  /** Said once when Seasonal brings the theme in (its season has come): at most 60 characters. */
  arrival: string;
  /** Exactly three. */
  secrets: readonly SecretDef[];
};
