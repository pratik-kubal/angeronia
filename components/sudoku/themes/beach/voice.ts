import { scaleNote, tone, type Voice } from "../../feedback";

// Beach's voice: a steel pan in G major pentatonic, a fourth below Aurora's C, so it sits warm and
// round. Each strike is a sine body, a quick octave shimmer and a faint metallic partial (the pan's
// ring); a refused digit is a drop of water, never a buzzer. Every gain stays at or under 0.3.

const PAN = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];
/** Step `k` of the scale from G4: digits 1–9 land on G4 to D6. */
const pan = (k: number) => scaleNote(PAN, 392, k);

/** One steel-pan strike. */
function ping(freq: number, delay: number, dur: number, gain: number) {
  tone(freq, null, delay, dur, "sine", gain);
  tone(freq * 2, null, delay, dur * 0.4, "triangle", gain * 0.25);
  tone(freq * 2.76, null, delay, 0.035, "sine", gain * 0.1);
}

export const BEACH_VOICE: Partial<Voice> = {
  /** A placed digit: a soft pan strike, higher for higher digits. */
  place: (digit) => ping(pan(digit - 1), 0, 0.2, 0.3),
  /** Units finished at once: a chime of that many strikes and one more, over a lap of water. */
  complete(finished) {
    for (let k = 0; k <= finished; k++) ping(pan(4 + 2 * k), k * 0.07, 0.26, 0.24);
    tone(1400, 700, 0.04, 0.32, "sine", 0.04);
  },
  /** A new game: a little wave of shells that crests and falls back. */
  deal() {
    [0, 2, 4, 5, 6, 7, 6, 4, 2].forEach((k, i) => ping(pan(k), 0.18 + i * 0.065, 0.1, 0.12));
  },
  /** A tap in the sand. */
  pencil: () => tone(1650, 1320, 0, 0.025, "triangle", 0.08),
  /** A glint of sun. */
  hint() {
    tone(pan(7), pan(9), 0, 0.26, "sine", 0.26);
    tone(pan(9) * 2, null, 0.12, 0.18, "triangle", 0.05);
  },
  /** A soft drop of water. */
  miss: () => tone(587, 294, 0, 0.12, "sine", 0.2),
  /** A solved board: the pan runs up the scale, a shimmering chord, and two gulls far off. */
  win() {
    for (let k = 0; k < 9; k++) ping(pan(k), k * 0.07, 0.28, 0.26);
    [5, 7, 9, 10].forEach((k) => {
      tone(pan(k), null, 0.75, 0.9, "triangle", 0.14);
      tone(pan(k) * 1.004, null, 0.75, 0.9, "sine", 0.06);
    });
    tone(1500, 1180, 1.05, 0.18, "sine", 0.05);
    tone(1450, 1150, 1.3, 0.16, "sine", 0.04);
  },
  /** A secret: a slide whistle up, then a sparkle of pan strikes at the top of the scale. */
  secret() {
    tone(pan(5), pan(10), 0, 0.22, "sine", 0.16);
    [8, 10, 9, 10].forEach((k, i) => ping(pan(k), 0.24 + i * 0.07, 0.18, 0.2));
    tone(pan(10) * 2, null, 0.56, 0.35, "triangle", 0.06);
  },
};
