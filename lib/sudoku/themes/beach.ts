// Beach: a day at a little cove, by day under a butter sun and by night under a crescent moon with
// a glowing tide. A sandcastle drawn in the sand mirrors the board (box b is castle piece b: towers
// on the corners, walls on the edges, the keep in the middle) and each finished box packs its piece.

import { BOXES } from "../grid";
import { spells } from "./keypad";
import type { ThemeDef } from "./types";

/** Boxes 0, 2, 6 and 8 (the castle's four corner towers) and box 4 (its keep). */
const TOWERS_AND_KEEP = 0b101010101;

/** The finished 3×3 boxes of a grid, box b as bit b (what the scene draws as built pieces). */
export const finishedBoxes = (grid: readonly number[]) =>
  BOXES.reduce((mask, box, b) => (box.cells.every((i) => grid[i]) ? mask | (1 << b) : mask), 0);

export const beach: ThemeDef = {
  id: "beach",
  name: "Beach",
  emoji: "🏖️",
  blurb: "Sun, sea and a sandcastle you build box by box.",
  season: { from: [6, 1], to: [8, 31] },
  swatch: { light: ["#4cc3c8", "#ffd35c", "#f2d9ae"], dark: ["#0d3646", "#4fe3d6", "#ffb45c"] },
  emblem: "🐚",
  sparks: ["🐚", "🦀", "🌊", "☀️", "🐠", "🍦", "⛱️", "🐬"],
  solved: "Castle complete",
  arrival: "Summer's here. The sand is perfect for a castle.",
  secrets: [
    {
      id: "seven-seas",
      name: "Seven Seas",
      emoji: "🐬",
      riddle: "Knock quickly on the shell, once for each of the seven seas.",
      found: "Seven knocks, seven seas, and every one came to say hello.",
      on: ["emblem"],
      test: ({ moment }) => moment.kind === "emblem" && moment.taps === 7,
      surprise: "seven-seas",
    },
    {
      // The first five boxes finished are the four corners and then the centre: met by the move
      // that finishes the keep last of them (a box the deal gave whole doesn't count against it).
      // The corners first alone came up by chance in 2 to 3% of games.
      id: "four-towers",
      name: "Four Towers",
      emoji: "🏰",
      riddle: "Build like a pro: the four corner towers, then the middle.",
      found: "Corner towers first, then the keep, like a real builder.",
      on: ["move"],
      test: ({ moment }) => {
        if (moment.kind !== "move" || moment.move.kind === "miss") return false;
        if (!moment.move.units?.some((u) => u.kind === "box" && u.index === 4)) return false;
        const grid = moment.state?.grid;
        const puzzle = moment.state?.puzzle;
        return Array.isArray(grid) && Array.isArray(puzzle) && finishedBoxes(grid) === (TOWERS_AND_KEEP | finishedBoxes(puzzle));
      },
      surprise: "towers",
    },
    {
      id: "fry-thief",
      name: "Fry Thief",
      emoji: "🍟",
      riddle: "Place the fry thief, spelled on a phone keypad.",
      found: "4-8-5-5 spells gull, and one came for your fries!",
      on: ["move"],
      // GULL on a phone's keys: 4, 8, 5, 5, placed one after another.
      test: (c) => spells(c, "gull"),
      surprise: "gull-swoop",
    },
  ],
};
