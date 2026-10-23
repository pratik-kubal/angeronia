// localStorage: the game in progress (iOS drops background tabs, so a reload must resume it),
// the best solve time per difficulty, the trophy collection, the settings, the secrets found
// and the last theme Seasonal brought in. Every access is guarded: private mode and blocked
// storage just mean nothing is remembered.

import { parseSaved, type GameState } from "@/lib/sudoku/game";
import type { Difficulty } from "@/lib/sudoku/generate";
import { SEASON_TABLE, THEME_IDS, THEME_LIST, isThemeChoice, isThemeId, type ThemeChoice, type ThemeId } from "@/lib/sudoku/themes";
import type { Collection } from "@/lib/sudoku/trophies";

export const GAME = "sudoku:game";
const BEST = "sudoku:best-times";
const SETTINGS = "sudoku:settings";
const COLLECTION = "sudoku:collection";
const OWNER = "sudoku:owner";
const SECRETS = "sudoku:secrets";
const ARRIVED = "sudoku:arrived";

/** The fastest solve per difficulty, in ms. */
export type Best = Partial<Record<Difficulty, number>>;
export type Appearance = "system" | "light" | "dark";
export type Settings = { sound: boolean; haptics: boolean; appearance: Appearance; theme: ThemeChoice };
/** The secrets found, by theme: each theme's secret ids. */
export type Found = Partial<Record<ThemeId, string[]>>;

export const APPEARANCES: readonly Appearance[] = ["system", "light", "dark"];

function read(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? null : JSON.parse(raw);
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or blocked: the game still plays.
  }
}

export const loadGame = () => parseSaved(read(GAME));
/** A game from a storage event's raw value (another tab saved it). */
export function gameFrom(raw: string | null): GameState | null {
  try {
    return raw === null ? null : parseSaved(JSON.parse(raw));
  } catch {
    return null;
  }
}
export const saveGame = (state: GameState) => write(GAME, state);

/**
 * Several tabs: the one the player last used owns the game, and only the owner saves it and runs
 * its clock (two writers would undo each other's selection and notes). Without storage, every
 * tab owns its own game.
 */
export const claimGame = (tab: string) => write(OWNER, tab);
export function ownsGame(tab: string): boolean {
  const owner = read(OWNER);
  return owner === null || owner === tab;
}

export function loadBest(): Best {
  const value = read(BEST);
  if (!value || typeof value !== "object") return {};
  return Object.fromEntries(Object.entries(value).filter(([, v]) => typeof v === "number" && Number.isFinite(v))) as Best;
}
export const saveBest = (best: Best) => write(BEST, best);

export function loadCollection(): Collection {
  const value = read(COLLECTION);
  if (!value || typeof value !== "object") return {};
  return Object.fromEntries(
    Object.entries(value).filter(([, v]) => typeof v === "number" && Number.isInteger(v) && v > 0),
  ) as Collection;
}
export const saveCollection = (collection: Collection) => write(COLLECTION, collection);

export function loadSettings(): Settings {
  const value = read(SETTINGS) as Partial<Settings> | null;
  return {
    sound: value?.sound !== false,
    haptics: value?.haptics !== false,
    appearance: APPEARANCES.includes(value?.appearance as Appearance) ? (value!.appearance as Appearance) : "system",
    theme: isThemeChoice(value?.theme) ? value!.theme : "aurora",
  };
}
export const saveSettings = (settings: Settings) => write(SETTINGS, settings);

export function loadSecrets(): Found {
  const value = read(SECRETS);
  const found: Found = {};
  if (!value || typeof value !== "object") return found;
  for (const [theme, ids] of Object.entries(value)) {
    if (isThemeId(theme) && Array.isArray(ids)) found[theme] = ids.filter((id): id is string => typeof id === "string");
  }
  return found;
}
export const saveSecrets = (found: Found) => write(SECRETS, found);

/** The theme Seasonal last brought in (its arrival is announced once). */
export function loadArrived(): ThemeId | null {
  const value = read(ARRIVED);
  return isThemeId(value) ? value : null;
}
export const saveArrived = (theme: ThemeId) => write(ARRIVED, theme);

/**
 * Runs before the first paint (inlined by app/sudoku/page.tsx): resolves the saved appearance
 * (System follows prefers-color-scheme) to data-sdk-scheme="light" or "dark" and the saved theme
 * (Aurora unless one was picked; Seasonal follows the local date through SEASON_TABLE) to
 * data-sdk-theme on <html>, the two
 * switches sudoku.css and the theme stylesheets read, and tints Safari's bars (theme-color) with
 * the result's --bg, so a reload never flashes another look. Keep in step with resolveScheme,
 * resolveTheme (lib/sudoku/themes) and loadSettings; storage.test.ts checks it against them.
 */
export const LOOK_SCRIPT = `(function(){var r=document.documentElement,s={},I=${JSON.stringify(THEME_IDS)},S=${JSON.stringify(SEASON_TABLE)};try{s=JSON.parse(localStorage.getItem(${JSON.stringify(SETTINGS)})||"{}")||{}}catch(e){}var a=s.appearance==="light"||s.appearance==="dark"?s.appearance:matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light",t=I.indexOf(s.theme)>=0?s.theme:"aurora";if(s.theme==="seasonal"){var d=new Date(),m=(d.getMonth()+1)*100+d.getDate();for(var i=0;i<S.length;i++){var x=S[i];if(x[1]<=x[2]?m>=x[1]&&m<=x[2]:m>=x[1]||m<=x[2]){t=x[0];break}}}r.dataset.sdkScheme=a;r.dataset.sdkTheme=t;var g=getComputedStyle(r).getPropertyValue("--bg").trim();if(g)document.querySelectorAll('meta[name="theme-color"]').forEach(function(m){m.setAttribute("content",g)})})();`;

/**
 * Each theme's title emblem drawn in place of the 3×3 mark until the game has loaded (the server
 * and the first render know no theme, but LOOK_SCRIPT has already set data-sdk-theme), so a reload
 * never flashes Aurora's mark. Inlined by app/sudoku/page.tsx; the game then draws the same emoji.
 */
export const EMBLEM_STYLE = THEME_LIST.filter((t) => t.emblem)
  .map((t) => {
    const at = `html[data-sdk-theme="${t.id}"] .sdk-mark`;
    return `${at}{width:auto;height:auto;background:none;-webkit-mask:none;mask:none;font-size:15px;line-height:1}${at}::before{content:${JSON.stringify(t.emblem)}}`;
  })
  .join("");

export function resolveScheme(appearance: Appearance): "light" | "dark" {
  if (appearance !== "system") return appearance;
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
