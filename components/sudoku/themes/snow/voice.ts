import { scaleNote, tone, type Voice } from "../../feedback";

// Snow Day's voice: a music box. Every note is a tine (a sine with a faint ×2.76 shimmer, a struck
// bar's second mode, that dies first) on D major pentatonic from D5, so any run of digits sounds
// right together, and a placement stays soft enough to hear hundreds of times.

const SCALE = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];
const note = (k: number) => scaleNote(SCALE, 587.33, k);

function tine(freq: number, delay: number, dur: number, gain: number) {
  tone(freq, null, delay, dur, "sine", gain);
  tone(freq * 2.76, null, delay, dur * 0.3, "sine", gain * 0.16);
}

export const snowVoice: Partial<Voice> = {
  place: (digit) => tine(note(digit - 1), 0, 0.3, 0.26),
  /** Rows, columns or boxes finished: a little run, like lamps coming on down a street. */
  complete: (finished) => {
    for (let k = 0; k <= finished; k++) tine(note(5 + k * 2), 0.05 + k * 0.08, 0.5, 0.2);
  },
  /** A new game: flakes falling, a run down the scale. */
  deal: () => [10, 9, 8, 7, 6, 5, 4].forEach((k, i) => tine(note(k), 0.15 + i * 0.075, 0.16, 0.09)),
  /** A frost tick. */
  pencil: () => tone(2349.3, null, 0, 0.022, "sine", 0.07),
  hint: () => {
    tine(note(6), 0, 0.28, 0.2);
    tine(note(9), 0.1, 0.45, 0.2);
  },
  /** A boot in fresh snow: a soft thud, never a buzz. */
  miss: () => tone(196, 110, 0, 0.14, "sine", 0.3),
  win: () => {
    [0, 1, 2, 3, 4, 5, 6, 7, 8].forEach((k) => tine(note(k), k * 0.075, 0.36, 0.24));
    // A warm D major chord under the last notes, then one high tine.
    [0, 2, 3, 5].forEach((k) => tone(note(k) / 2, null, 0.72, 1.2, "triangle", 0.12));
    tine(note(10), 0.78, 1.1, 0.16);
  },
  /** A twinkle. */
  secret: () => {
    [9, 7, 8, 10].forEach((k, i) => tine(note(k), i * 0.07, 0.24, 0.2));
    tone(note(7) * 2, null, 0.32, 0.5, "sine", 0.05);
  },
};
