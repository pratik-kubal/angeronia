// The theme registry: every theme's definition, the calendar that Seasonal follows, and the
// secrets a moment of play unlocks. Pure; the look of each theme is in components/sudoku/themes/.

import { aurora } from "./aurora";
import { beach } from "./beach";
import { candy } from "./candy";
import { blossom } from "./blossom";
import { halloween } from "./halloween";
import { snow } from "./snow";
import { THEME_IDS, type MonthDay, type SecretContext, type SecretDef, type Season, type ThemeChoice, type ThemeDef, type ThemeId } from "./types";

export * from "./types";

export const THEMES: Record<ThemeId, ThemeDef> = { aurora, candy, beach, halloween, snow, blossom };

/** Every theme, in the picker's order. */
export const THEME_LIST: readonly ThemeDef[] = THEME_IDS.map((id) => THEMES[id]);

export const isThemeId = (value: unknown): value is ThemeId => THEME_IDS.includes(value as ThemeId);
export const isThemeChoice = (value: unknown): value is ThemeChoice => value === "seasonal" || isThemeId(value);

/** A month and day as one number (October 31 is 1031), so seasons compare as ranges. */
const dayKey = ([month, day]: MonthDay) => month * 100 + day;

export function inSeason(season: Season, date: Date): boolean {
  const today = dayKey([date.getMonth() + 1, date.getDate()]);
  const from = dayKey(season.from);
  const to = dayKey(season.to);
  return from <= to ? today >= from && today <= to : today >= from || today <= to;
}

/**
 * The seasons as [id, from, to] day keys, in THEME_IDS order: what the pre-paint script
 * (components/sudoku/storage.ts) checks, so it picks exactly what seasonalTheme picks.
 */
export const SEASON_TABLE: readonly (readonly [ThemeId, number, number])[] = THEME_LIST.flatMap((t) =>
  t.season ? [[t.id, dayKey(t.season.from), dayKey(t.season.to)] as const] : [],
);

/** The theme whose season the date is in (seasons never overlap), else Aurora. */
export function seasonalTheme(date: Date): ThemeId {
  return THEME_LIST.find((t) => t.season && inSeason(t.season, date))?.id ?? "aurora";
}

export function resolveTheme(choice: ThemeChoice, date: Date): ThemeId {
  return choice === "seasonal" ? seasonalTheme(date) : choice;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const formatDay = ([month, day]: MonthDay) => `${MONTHS[month - 1]} ${day}`;

/** "Oct 1 – Nov 2", or "All year" for a theme of no season. */
export function formatSeason(season: Season | null): string {
  return season ? `${formatDay(season.from)} – ${formatDay(season.to)}` : "All year";
}

/** The theme's secrets the moment meets (a test that throws counts as not met). */
export function secretsAt(theme: ThemeId, context: SecretContext): SecretDef[] {
  return THEMES[theme].secrets.filter((s) => {
    if (!s.on.includes(context.moment.kind)) return false;
    try {
      return s.test(context);
    } catch {
      return false;
    }
  });
}

export const secretById = (theme: ThemeId, id: string): SecretDef | undefined => THEMES[theme].secrets.find((s) => s.id === id);
