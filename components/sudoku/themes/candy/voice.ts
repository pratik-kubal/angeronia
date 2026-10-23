import { scaleNote, tone, type Voice } from "../../feedback";

// Candy's voice: soft pops, like sweets dropped into a paper bag. Each pop is a sine that drops an
// octave in a blink, with a faint triangle click on top, pitched on an F major pentatonic so a run of
// digits plays a little tune. A refused digit is a dull, low pop. Every gain stays at or under 0.3.

const SCALE = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];
/** Step `k` of the scale from F4: digits 1–9 land on F4 to C6. */
const step = (k: number) => scaleNote(SCALE, 349.23, k);

/** One soft pop. */
function pop(freq: number, delay: number, gain: number) {
  tone(freq * 1.5, freq * 0.75, delay, 0.09, "sine", gain);
  tone(freq * 3, null, delay, 0.02, "triangle", gain * 0.2);
}

export const CANDY_VOICE: Partial<Voice> = {
  /** A placed digit: a pop, higher for higher digits. */
  place: (digit) => pop(step(digit - 1), 0, 0.28),
  /** Units finished at once: a quick run of pops, one more than were finished. */
  complete(finished) {
    for (let k = 0; k <= finished; k++) pop(step(4 + 2 * k), k * 0.06, 0.24);
  },
  /** A new game: the jar shaken, sweets settling down the scale. */
  deal() {
    [8, 6, 7, 5, 4, 3, 2, 1, 0].forEach((k, i) => pop(step(k), 0.16 + i * 0.055, 0.12));
  },
  /** A tap of the pencil. */
  pencil: () => tone(1800, 1400, 0, 0.02, "triangle", 0.07),
  /** A wrapper crinkling open. */
  hint() {
    pop(step(7), 0, 0.22);
    pop(step(9), 0.08, 0.2);
  },
  /** A dull low pop. */
  miss: () => tone(260, 150, 0, 0.12, "sine", 0.2),
  /** A solved board: pops up the scale, then a bright chord. */
  win() {
    for (let k = 0; k < 9; k++) pop(step(k), k * 0.06, 0.26);
    [5, 7, 9].forEach((k) => tone(step(k), null, 0.62, 0.7, "triangle", 0.12));
  },
  /** A secret: a handful of sweets tipped out, pops tumbling down. */
  secret() {
    [10, 8, 9, 6, 7, 4, 5, 2].forEach((k, i) => pop(step(k), i * 0.05, 0.2));
  },
};
