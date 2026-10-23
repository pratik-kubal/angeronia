import { scaleNote, semis, tone, type Voice } from "../../feedback";

// Halloween's voice: E minor pentatonic from E4, spooky-cute and never sour. A placed digit is a
// hollow knock on a pumpkin, a finished unit a lantern chime, and a solved board a music-box run
// that resolves warmly to E major.

const SPOOKY = [0, 3, 5, 7, 10, 12, 15, 17, 19, 22, 24];
const E4 = 329.63;
const note = (k: number) => scaleNote(SPOOKY, E4, k);

export const halloweenVoice: Partial<Voice> = {
  /** A hollow wooden tok, higher for higher digits (1 is A4, 9 is E6). */
  place(digit) {
    const f = note(digit + 1);
    tone(f * 1.06, f, 0, 0.12, "sine", 0.34);
    tone(f * 4, null, 0, 0.03, "sine", 0.05);
  },
  /** A lantern chime of that many notes and one more, then a glint. */
  complete(finished) {
    for (let k = 0; k <= finished; k++) tone(note(4 + k * 2), null, k * 0.07, 0.24, "sine", 0.26);
    tone(note(10) * 2, null, (finished + 1) * 0.07, 0.2, "triangle", 0.04);
  },
  /** A friendly "whoo", then nine ticks like reels landing. */
  deal() {
    tone(392, 523.25, 0.02, 0.5, "sine", 0.1);
    for (let k = 0; k < 9; k++) tone(note(k), null, 0.18 + k * 0.07, 0.07, "triangle", 0.12);
  },
  /** A quill's tick. */
  pencil() {
    tone(1975.5, null, 0, 0.02, "sine", 0.08);
  },
  /** A candle catching. */
  hint() {
    tone(note(6), note(8), 0, 0.28, "sine", 0.26);
    tone(note(10), null, 0.16, 0.22, "triangle", 0.07);
  },
  /** A soft hollow bonk, never a buzz. */
  miss() {
    tone(220, 165, 0, 0.18, "sine", 0.3);
    tone(440, 330, 0, 0.05, "triangle", 0.06);
  },
  /** A music-box run, then a warm E major chord as the fireworks go up. */
  win() {
    for (let k = 0; k < 9; k++) tone(note(k + 1), null, k * 0.07, 0.3, "sine", 0.28);
    [12, 16, 19, 24].forEach((n) => tone(semis(E4, n), null, 0.75, 0.9, "triangle", 0.15));
  },
  /** A ghostly whoo, then a sparkle. */
  secret() {
    tone(523.25, 783.99, 0, 0.3, "sine", 0.2);
    tone(783.99, 622.25, 0.28, 0.45, "sine", 0.16);
    [8, 9, 10].forEach((k, i) => tone(note(k) * 2, null, 0.6 + i * 0.06, 0.16, "triangle", 0.05));
  },
};
