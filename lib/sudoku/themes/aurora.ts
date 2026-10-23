// Aurora: the original look, a pastel dawn in light and an indigo night in dark, and the default.
// No season: it is what Seasonal shows between the others. Its secrets play on nine and on ones:
// nine knocks on the 3×3 mark, counting to nine across the nine boxes, and a 1 placed in the
// minute whose time of day reads only ones.

import { boxOf } from "../grid";
import type { SecretContext, ThemeDef } from "./types";

/** The hours whose time of day reads nothing but ones at minute 11: 1:11 and 11:11, morning and evening. */
const ALL_ONES_HOURS = new Set([1, 11, 13, 23]);

/**
 * The digits placed (a refused one counts for nothing) end by counting 1 to 9, each in a box of
 * its own, the moment's own move last. The boxes are what keep it a secret: a player who looks for
 * one of each digit in turn (a 1, then a 2, … then round again) counts to nine by accident in
 * nearly half their easy games, but almost never across all nine boxes.
 */
function countedToNine({ moment, recent }: SecretContext): boolean {
  if (moment.kind !== "move" || moment.move.kind === "miss") return false;
  const placed = recent.filter((m) => m.kind !== "miss");
  if (placed[placed.length - 1]?.seq !== moment.move.seq) return false;
  const run = placed.slice(-9);
  return run.length === 9 && run.every((m, k) => m.digit === k + 1) && new Set(run.map((m) => boxOf(m.cell))).size === 9;
}

export const aurora: ThemeDef = {
  id: "aurora",
  name: "Aurora",
  emoji: "🌌",
  blurb: "The original: a pastel dawn, or a neon night.",
  season: null,
  swatch: { light: ["#cdb8ff", "#ffc4e6", "#ffd6b4"], dark: ["#2de2d0", "#7b6bff", "#f45bdb"] },
  emblem: null,
  sparks: [],
  solved: "Solved",
  arrival: "The aurora is back.",
  secrets: [
    {
      id: "star-trails",
      name: "Star Trails",
      emoji: "💫",
      riddle: "The tiny grid by the name has nine panes. Knock on each, quickly.",
      found: "Nine knocks, and the whole sky turned around the little grid.",
      on: ["emblem"],
      // Every ninth knock in a row plays it again.
      test: ({ moment }) => moment.kind === "emblem" && moment.taps >= 9 && moment.taps % 9 === 0,
      surprise: "star-trails",
    },
    {
      id: "constellation",
      name: "Your Constellation",
      emoji: "🔭",
      riddle: "Count to nine, no skipping, each digit in a box of its own.",
      found: "Nine digits counted across nine boxes drew your constellation.",
      on: ["move"],
      test: countedToNine,
      surprise: "constellation",
    },
    {
      id: "make-a-wish",
      name: "Make a Wish",
      emoji: "🌠",
      riddle: "Wish on a 1 when the time of day reads only ones.",
      found: "A star fell for your wish, and one falls for every 1 this minute.",
      on: ["move"],
      // A 1 placed or hinted: any digit would be met by chance in about one game in twenty.
      test: ({ moment, now }) =>
        moment.kind === "move" &&
        moment.move.kind !== "miss" &&
        moment.move.digit === 1 &&
        now.getMinutes() === 11 &&
        ALL_ONES_HOURS.has(now.getHours()),
      surprise: "meteor-shower",
    },
  ],
};
