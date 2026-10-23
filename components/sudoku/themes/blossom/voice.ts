import { scaleNote, tone, type Voice } from "../../feedback";

// Blossom's voice: a music box in a spring garden, D major pentatonic from D5. A placed digit is
// a raindrop's plink with a kalimba shimmer; finished units chime; a refused digit is a soft
// plip-plop of rain (never an alarm); the win and the secrets end in birdsong.

const SCALE = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];
const n = (k: number) => scaleNote(SCALE, 587.33, k);

export const blossomVoice: Partial<Voice> = {
  place(digit) {
    const f = n(digit - 1);
    tone(f, f * 1.03, 0, 0.13, "sine", 0.3);
    tone(f * 2.76, null, 0.004, 0.05, "sine", 0.04);
  },
  complete(finished) {
    for (let k = 0; k <= finished; k++) {
      tone(n(4 + k * 2), null, k * 0.07, 0.32, "triangle", 0.2);
      tone(n(4 + k * 2) / 2, null, k * 0.07, 0.24, "sine", 0.12);
    }
  },
  /** Seeds dropping into the bed, then a chirp. */
  deal() {
    for (let k = 0; k < 9; k++) tone(n(k) / 2, null, 0.16 + k * 0.065, 0.08, "sine", 0.16);
    tone(2900, 3800, 0.75, 0.07, "sine", 0.05);
  },
  /** A twig's tick. */
  pencil() {
    tone(2400, 2600, 0, 0.025, "sine", 0.08);
  },
  /** A sunbeam. */
  hint() {
    tone(n(7), n(9), 0, 0.28, "sine", 0.26);
    tone(n(9) * 2, null, 0.12, 0.22, "triangle", 0.05);
  },
  miss() {
    tone(660, 520, 0, 0.11, "sine", 0.24);
    tone(495, 415, 0.08, 0.14, "sine", 0.18);
  },
  /** A spring song up the scale, a warm chord, then a trill. */
  win() {
    for (let k = 0; k < 9; k++) tone(n(k), null, k * 0.07, 0.3, "triangle", 0.24);
    [4, 6, 8, 10].forEach((k) => tone(n(k), null, 0.72, 1, "sine", 0.16));
    [0.9, 1.02, 1.14].forEach((t) => tone(3000, 4100, t, 0.06, "sine", 0.07));
  },
  /** Birdsong over a warm note. */
  secret() {
    const song: [number, number, number, number][] = [
      [2500, 3700, 0, 0.07],
      [3700, 2900, 0.09, 0.06],
      [2700, 3900, 0.19, 0.06],
      [3900, 3100, 0.27, 0.06],
      [2600, 4200, 0.4, 0.14],
    ];
    song.forEach(([from, to, at, dur]) => tone(from, to, at, dur, "sine", 0.1));
    tone(n(2), null, 0, 0.5, "triangle", 0.08);
  },
};
