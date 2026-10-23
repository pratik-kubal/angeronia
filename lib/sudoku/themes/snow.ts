// Snow Day: no school, and the whole day to fill. A cold blue-and-white world with one warm red
// (mittens, a scarf, the selection) and one warm gold (lamplight, a finished unit). A mitten is
// pegged on the line for every finished box. Seasonal brings it in from December 1 to January 31.

import type { Move } from "../game";
import { colOf, rowOf } from "../grid";
import { spells } from "./keypad";
import type { SecretDef, ThemeDef } from "./types";

/** The title's snowman throws on every third quick poke (3, 6, 9…). */
const POKES = 3;

/** A column of boxes (0–2), and a row of boxes (0 top, 2 bottom). */
const band = (cell: number) => Math.floor(colOf(cell) / 3);
const tier = (cell: number) => Math.floor(rowOf(cell) / 3);

/**
 * The last three digits placed (refused ones skipped, a hint breaks it) are 8s stacked up one
 * column of boxes from the ground: the bottom box, then the middle, then the top, the last of
 * them the move `seq`.
 */
export function stackedEights(recent: readonly Move[], seq: number): boolean {
  const placed = recent.filter((m) => m.kind !== "miss").slice(-3);
  if (placed.length < 3 || placed[2].seq !== seq) return false;
  const column = band(placed[0].cell);
  return placed.every((m, i) => m.kind === "place" && m.digit === 8 && band(m.cell) === column && tier(m.cell) === 2 - i);
}

const snowballFight: SecretDef = {
  id: "snowball-fight",
  name: "Snowball Fight",
  emoji: "🧤",
  // "Quick": a slow third poke starts the count again (EMBLEM_TAP_MS).
  riddle: "A snowman can take two quick pokes. On the third, he fights back.",
  found: "Splat. Not bad for someone with twigs for arms.",
  on: ["emblem", "scene"],
  // The title's snowman, or (on a wide screen) the snowman in the yard, which counts its own pokes.
  test: ({ moment }) =>
    (moment.kind === "emblem" && moment.taps >= POKES && moment.taps % POKES === 0) ||
    (moment.kind === "scene" && moment.target === `snowman-${POKES}`),
  surprise: "snowball",
};

const eightSnowman: SecretDef = {
  id: "eight-snowman",
  name: "Snowman of 8s",
  emoji: "☃️",
  riddle: "Every 8 is a little snowman. Stack three, from the ground up.",
  found: "Bottom, middle, head. You built a snowman out of 8s.",
  on: ["move"],
  test: ({ moment, recent }) => moment.kind === "move" && moment.move.kind === "place" && stackedEights(recent, moment.move.seq),
  surprise: "stack",
};

const cocoaBreak: SecretDef = {
  id: "cocoa-break",
  name: "Cocoa Break",
  emoji: "☕",
  riddle: "Place the snow day drink, spelled on a phone keypad.",
  found: "2-6-2-6-2 spells cocoa, with marshmallows on top.",
  on: ["move"],
  // COCOA on a phone's keys: 2, 6, 2, 6, 2, placed one after another.
  test: (c) => spells(c, "cocoa"),
  surprise: "cocoa",
};

export const snow: ThemeDef = {
  id: "snow",
  name: "Snow Day",
  emoji: "⛄",
  blurb: "No school today. Mittens on, cocoa after.",
  season: { from: [12, 1], to: [1, 31] },
  swatch: { light: ["#9cc0ec", "#dfeaf8", "#c8324a"], dark: ["#0b1530", "#2d4b8e", "#ffc65c"] },
  emblem: "⛄",
  sparks: ["❄️", "⛄", "🧣", "🧤", "☕", "🛷"],
  solved: "Cocoa earned",
  arrival: "It snowed all night. School's off.",
  secrets: [snowballFight, eightSnowman, cocoaBreak],
};
