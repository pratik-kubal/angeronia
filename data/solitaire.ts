// Solitaire (/solitaire) copy: how to play, the statistics, the result sheet and the messages.

import type { FxKind } from "@/components/solitaire/win";

export const HOW_TO_PLAY = [
  "Build the four foundations up by suit, from Ace to King.",
  "On the table, stack cards down in alternating colours: a red 9 on a black 10. Move a run as one. Only a King, or a run led by one, fills an empty column.",
  "Tap the stock to turn three cards; only the top one plays. When the stock runs out, tap it again to turn the waste back over, as often as you like.",
  "Tap a card to send it where it fits, its foundation first. Or drag it. A card can be dragged back down off a foundation.",
  "Every deal here can be won. Hint shows a move that keeps it winnable when it finds one, and Undo takes back any move.",
  "Windows scoring: 10 for each card to a foundation, 5 for a waste card onto the table or a card turned over, −15 for one taken back off a foundation, −20 for each turn of the waste after the third, and −2 every 10 seconds. A win in more than 30 seconds adds 700,000 ÷ seconds.",
];

export const STATS_COPY = {
  played: "Played",
  won: "Won",
  rate: "Win rate",
  streak: "Streak",
  bestStreak: "Best streak",
  bestTime: "Fastest win",
  bestScore: "Best score",
};

/** The result sheet's heading, by the win animation that played. */
export const WIN_HEADINGS: Record<FxKind, string> = {
  cascade: "Solved, the classic way",
  fountain: "Solved, in a shower of cards",
  spiral: "Solved, and the deck took a spin",
  waterfall: "Solved, and the deck tumbled",
};
export const WIN_HEADING = "Solved";

/** The Menu's way back to the games launcher (DECISIONS.md ADR-021). */
export const ALL_GAMES = { label: "All games", href: "/games" } as const;

export const NO_MOVES = "No useful moves left. Undo, or deal again.";
