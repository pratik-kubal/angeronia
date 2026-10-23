// Candy: a sweet shop's counter at night. Every digit is a sweet of its own colour, wrapped (a tile)
// until all nine are placed and bare after. No season: it is picked from the list, never by
// Seasonal. Its secrets play on sweets: twisting the one by the name open, spelling CANDY on the
// pad, and placing sweets in rainbow order.

import { placedInOrder, spells } from "./keypad";
import type { ThemeDef } from "./types";

/** Red, orange, green, blue and purple: Candy's 1, 2, 5, 7 and 9. */
export const RAINBOW = [1, 2, 5, 7, 9] as const;

export const candy: ThemeDef = {
  id: "candy",
  name: "Candy",
  emoji: "🍬",
  blurb: "Every digit its own sweet, on a slate counter.",
  season: null,
  swatch: { light: ["#e66b1c", "#e41c62", "#1c9db1"], dark: ["#e41c62", "#d453d4", "#1c9db1"] },
  emblem: "🍬",
  sparks: ["🍬", "🍭", "🍫", "🍩"],
  solved: "Sweet!",
  arrival: "The sweet shop is open.",
  secrets: [
    {
      id: "unwrapped",
      name: "Unwrapped",
      emoji: "🍬",
      riddle: "The sweet by the name has two twisted ends. Twist each one twice.",
      found: "Four twists, and the sweet burst into a shower of sweets!",
      on: ["emblem"],
      // Every fourth twist in a row unwraps it again.
      test: ({ moment }) => moment.kind === "emblem" && moment.taps >= 4 && moment.taps % 4 === 0,
      surprise: "unwrap",
    },
    {
      id: "candy-jar",
      name: "Candy Jar",
      emoji: "🍭",
      riddle: "Spell the shop's name on the pad, the way a phone's keys would.",
      found: "C-A-N-D-Y on the pad, and the jar tipped over!",
      on: ["move"],
      test: (c) => spells(c, "candy"),
      surprise: "jar",
    },
    {
      id: "rainbow-drops",
      name: "Rainbow Drops",
      emoji: "🌈",
      riddle: "Place sweets in rainbow order: red, orange, green, blue, then purple.",
      found: "A rainbow of sweets, and drops fell in every colour!",
      on: ["move"],
      test: (c) => placedInOrder(c, RAINBOW),
      surprise: "rainbow",
    },
  ],
};
