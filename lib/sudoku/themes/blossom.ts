// Blossom: a picture-book spring garden. By day an April morning under a cherry branch; by night
// the same garden under the moon, its blossoms glowing. Nine flowers, one per 3×3 box, open as
// the boxes finish, and the branch fills with blossom as the board fills.

import { colOf, rowOf } from "../grid";
import { spells } from "./keypad";
import type { SecretDef, ThemeDef } from "./types";

/** Every fifth quick tap on the title (5, 10, 15…) shakes the branch again. */
const SHAKE_TAPS = 5;
/** The rainbow's countdown: the digits 7 down to 1, placed one after another, each in a row and a column of its own. */
const BOW = 7;

const petalShower: SecretDef = {
  id: "petal-shower",
  name: "Petal Shower",
  emoji: "🌸",
  riddle: "The blossom by the name sheds its petals at five quick taps.",
  found: "You shook the branch, and spring fell in petals.",
  on: ["emblem"],
  test: ({ moment }) => moment?.kind === "emblem" && moment.taps >= SHAKE_TAPS && moment.taps % SHAKE_TAPS === 0,
  surprise: "petal-shower",
};

const afterTheRain: SecretDef = {
  id: "after-the-rain",
  name: "After the Rain",
  emoji: "🌈",
  riddle: "Plant seven down to one, each in its own row and column.",
  found: "Seven down to one, and the rain gave way to a rainbow.",
  on: ["move"],
  // The last seven digits placed by hand are 7 down to 1, the 1 just now, no two in one row or
  // column. A refused digit is a free try (skipped); a hint breaks the run. The rows and columns
  // keep habit out: a player going round the pad 9, 8, 7… places the countdown every lap, but
  // wherever the cells happen to be.
  test: ({ moment, recent }) => {
    if (moment?.kind !== "move" || moment.move?.kind !== "place" || moment.move.digit !== 1 || !Array.isArray(recent)) return false;
    const run = recent.filter((m) => m?.kind !== "miss").slice(-BOW);
    return (
      run.length === BOW &&
      run[BOW - 1]?.seq === moment.move.seq &&
      run.every((m, k) => m?.kind === "place" && m.digit === BOW - k) &&
      new Set(run.map((m) => rowOf(m.cell))).size === BOW &&
      new Set(run.map((m) => colOf(m.cell))).size === BOW
    );
  },
  surprise: "rainbow",
};

const busyBee: SecretDef = {
  id: "busy-bee",
  name: "Busy Bee",
  emoji: "🐝",
  riddle: "Place a bee's song, spelled on a phone keypad.",
  found: "2-8-9-9 spells buzz, and a bee came to every flower.",
  on: ["move"],
  // BUZZ on a phone's keys: 2, 8, 9, 9, placed one after another.
  test: (c) => spells(c, "buzz"),
  surprise: "bumblebee",
};

export const blossom: ThemeDef = {
  id: "blossom",
  name: "Blossom",
  emoji: "🌸",
  blurb: "A spring garden that blooms one box at a time.",
  season: { from: [3, 20], to: [5, 15] },
  swatch: {
    light: ["#f9b9cf", "#fff6e0", "#b5dd9c"],
    dark: ["#ff9ec6", "#2a1a3a", "#4f9e7a"],
  },
  emblem: "🌸",
  sparks: ["🌸", "🌷", "🌼", "🐝", "🦋", "🌈", "🌱", "🍃"],
  solved: "In full bloom",
  arrival: "Spring sprang.",
  secrets: [petalShower, afterTheRain, busyBee],
};
