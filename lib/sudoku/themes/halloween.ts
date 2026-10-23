// Halloween: a cozy pumpkin patch, spooky-cute. By day an October afternoon with a pale moon up
// early; by night the same hill under a honey moon. Nine pumpkins sit on a vine under the board,
// one per 3×3 box, and each finished box carves and lights its own; the moon waxes as the board
// fills, and a solved board lights them all under a full moon that smiles back.

import type { GameState, Move } from "../game";
import { BOXES } from "../grid";
import type { Moment, SecretDef, ThemeDef } from "./types";

/** Knocks on the title's pumpkin, like at a door. */
const KNOCKS = 3;

/** A jack-o'-lantern's face on the board's boxes, as bits: the eyes (the top corners), the nose (the centre) and the grin (the bottom row). */
export const FACE = (1 << 0) | (1 << 2) | (1 << 4) | (1 << 6) | (1 << 7) | (1 << 8);

type Play = { kind: "move"; state: GameState; move: Extract<Move, { kind: "place" | "hint" }> };
/** A digit placed or a hint taken (a refused digit isn't a play). */
const played = (moment: Moment): moment is Play => moment.kind === "move" && (moment.move?.kind === "place" || moment.move?.kind === "hint");

/** The finished 3×3 boxes of a grid, box b as bit b (none of a grid that isn't there). */
const boxMask = (grid: readonly number[] | undefined) => BOXES.reduce((mask, box, b) => (box.cells.every((i) => grid?.[i]) ? mask | (1 << b) : mask), 0);

const trickOrTreat: SecretDef = {
  id: "trick-or-treat",
  name: "Trick or Treat",
  emoji: "🍬",
  riddle: "Knock three times on the pumpkin up top, like at a door.",
  found: "The door opened: treats, and now and then a tiny trick.",
  on: ["emblem"],
  // Exactly the third knock in a row: a fourth doesn't play it again, a pause starts over.
  test: ({ moment }) => moment.kind === "emblem" && moment.taps === KNOCKS,
  surprise: "trick-or-treat",
};

const boardOLantern: SecretDef = {
  id: "board-o-lantern",
  name: "Board-o'-Lantern",
  emoji: "🎃",
  riddle: "Carve only a face into the board: two eyes, a nose, a grin.",
  found: "You carved the whole board into a jack-o'-lantern.",
  on: ["move"],
  // On the move that finishes the face's last box, with no other box finished by play (a box that
  // was all clues from the start doesn't count). A win finishes every box, so it never qualifies.
  test: ({ moment }) => {
    if (!played(moment) || !moment.move.units?.some((unit) => unit.kind === "box")) return false;
    const done = boxMask(moment.state?.grid);
    const given = boxMask(moment.state?.puzzle);
    return (done & FACE) === FACE && (done & ~FACE & ~given & 0x1ff) === 0;
  },
  surprise: "board-o-lantern",
};

const halloweenOClock: SecretDef = {
  id: "halloween-oclock",
  name: "Halloween O'Clock",
  emoji: "👻",
  riddle: "Halloween is a date. Play its 3 when the time of day matches.",
  found: "A 3 at 10:31, and the ghosts came out for a little parade.",
  on: ["move"],
  // 10/31 read as a time: 10:31 in the morning or at night, so a 12-hour or a 24-hour clock both work.
  // Only its 3 counts: any digit would be met by whoever plays through that minute, and every
  // placement would start the parade over.
  test: ({ moment, now }) => played(moment) && moment.move.digit === 3 && now.getMinutes() === 31 && now.getHours() % 12 === 10,
  surprise: "ghost-parade",
};

export const halloween: ThemeDef = {
  id: "halloween",
  name: "Halloween",
  emoji: "🎃",
  blurb: "Nine pumpkins to light under a big, friendly moon.",
  season: { from: [10, 1], to: [11, 2] },
  swatch: { light: ["#ffcf7a", "#e9d5fb", "#ff9a4d"], dark: ["#ff8a2a", "#3d2163", "#ffd36e"] },
  emblem: "🎃",
  sparks: ["🎃", "👻", "🦇", "🍬", "🍭", "🍫", "🌕", "🍂"],
  solved: "All lit up",
  arrival: "The pumpkins are out. The ghosts are friendly.",
  secrets: [trickOrTreat, boardOLantern, halloweenOClock],
};
