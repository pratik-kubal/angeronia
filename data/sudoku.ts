// Sudoku (/sudoku) copy: the difficulties, how to play, the rarities, the result sheet and the
// theme picker. The 100 trophies live in data/sudoku-trophies.ts; each theme's own words (its
// name, blurb, result heading and secrets) live with its definition in lib/sudoku/themes/.

import type { Difficulty } from "@/lib/sudoku/generate";
import type { Rarity } from "@/lib/sudoku/trophies";

export const DIFFICULTY_COPY: Record<Difficulty, { name: string; blurb: string }> = {
  easy: { name: "Easy", blurb: "Lots of clues. A relaxed solve." },
  medium: { name: "Medium", blurb: "Fewer clues. Still no guessing." },
  hard: { name: "Hard", blurb: "Sparse clues. Plan every move." },
};

export const HOW_TO_PLAY = [
  "Fill every row, column and 3×3 box with the digits 1 to 9, each once.",
  "Tap a cell, then a number. A number that doesn't fit simply won't go in.",
  "The pencil key pencils candidates into a cell (tap again to remove one); placing a digit clears it from the cells it sees.",
  "Beside each number, a little stack counts how many of it are still to place.",
  "A hint fills a cell in for you, three times a game.",
  "Every solved board wins a trophy. There are 100 to collect, some far rarer than others.",
  "Pick a theme from Themes, or let the seasons pick. Each one hides three secrets. Poke around.",
];

export const RARITY_COPY: Record<Rarity, string> = {
  legendary: "Legendary",
  epic: "Epic",
  rare: "Rare",
  uncommon: "Uncommon",
  common: "Common",
};

export const RESULT_COPY = { next: "New game", newFind: "New find", again: "Found again" };

export const THEME_COPY = {
  /** The settings row and the picker's title. */
  row: "Theme",
  title: "Themes",
  seasonal: "Seasonal",
  seasonalBlurb: "Follows the calendar.",
  now: "Now",
  inSeason: "In season",
  secrets: "Secrets",
  hidden: "Still hidden",
  secretFound: "Secret found",
  arrived: "Now in season",
  /** Aurora's arrival, when Seasonal brings it back between the others. */
  between: "Between seasons",
  secretsNote: "Each theme hides three secrets. Riddles show the way.",
};
