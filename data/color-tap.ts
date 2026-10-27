// Color Tap's own words (the games keep their copy out of data/angeronia.ts: DECISIONS.md ADR-019,
// ADR-022). The pictures themselves come from lib/color-tap/pictures.ts, generated from the photos.

import type { LevelId } from "@/lib/color-tap/types";

export const TITLE = "Color Tap";

/** A saved web app has no back button, so the game keeps its own way back (ADR-021). */
export const ALL_GAMES = { label: "All games", href: "/games" } as const;

/** One line per level in the New painting sheet. */
export const LEVEL_LINE: Record<LevelId, string> = {
  easy: "Big, friendly shapes.",
  medium: "More shades, smaller areas.",
  hard: "The details start to show.",
  expert: "Fine work, close to the photo.",
  master: "Every shade the photo has.",
};

export const HOW_TO_PLAY: readonly string[] = [
  "Pick a colour at the bottom: its areas get a grey checker.",
  "Tap an area with that number to paint it. Pinch, scroll or use the slider to zoom.",
  "Can't find the last one? The magnifier flies you to it (it has a few uses per painting).",
  "Auto-paint finishes the picture for you, area by area. Tap anywhere to stop it.",
  "With a keyboard: arrows pick a colour in the paint box; on the picture, N finds the colour's next area (Shift+N the one before), Enter or Space paints it, M is the magnifier, arrows pan, + − 0 zoom and Escape stops auto-paint.",
];

/** What the picture's keys do, for screen readers (the canvas is described by it). */
export const KEYS = "N or Shift+N: the next or previous area of the colour. Enter: paint it. M: the magnifier. Arrows: pan. Plus, minus, 0: zoom. Escape: stop auto-paint.";

export const SILENT_MODE = "On an iPhone or iPad, Silent Mode mutes the game's sounds.";

export const COACH = "Tap a highlighted area";

export const EMPTY = "Add a JPG to public/paint-by-numbers/ and restart the dev server to paint it.";
