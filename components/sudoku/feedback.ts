// Sound and touch, with no files to load. Sound is a tiny Web Audio synth: iOS starts an
// AudioContext only from a gesture, so unlockAudio() runs on every tap (cheap once it's running)
// and the notes played later from timers (a chime, the win) sound once it has. Each theme may
// bring its own voice (setVoice), built from tone() and the scale helpers here. Haptics use
// navigator.vibrate where it exists (Android); iOS Safari has none, but since iOS 18 toggling an
// <input type="checkbox" switch> plays the system tick, so a hidden one stands in.

type Ctx = { ctx: AudioContext; out: GainNode };
let audio: Ctx | null = null;

export function unlockAudio() {
  if (!audio) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    const out = ctx.createGain();
    out.gain.value = 0.22;
    out.connect(ctx.destination);
    audio = { ctx, out };
  }
  if (audio.ctx.state !== "running") void audio.ctx.resume();
}

/** One note: `freq` Hz (gliding to `glideTo` when given) starting `delay` s from now. */
export function tone(freq: number, glideTo: number | null, delay: number, dur: number, type: OscillatorType, gain: number) {
  if (!audio || audio.ctx.state !== "running") return;
  const { ctx, out } = audio;
  const t = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (glideTo !== null) osc.frequency.exponentialRampToValueAtTime(glideTo, t + dur);
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(gain, t + 0.008);
  env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(env).connect(out);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

/** The frequency `n` semitones above `base` Hz. */
export const semis = (base: number, n: number) => base * 2 ** (n / 12);

/** C major pentatonic from C5: every digit and chime lands on a note that sounds right with the rest. */
const PENTATONIC = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];
/** Step `k` of a scale (semitones above `base` Hz), held on its top note past the end. */
export const scaleNote = (scale: readonly number[], base: number, k: number) => semis(base, scale[Math.min(k, scale.length - 1)]);
const note = (k: number) => scaleNote(PENTATONIC, 523.25, k);

/** Everything the game sounds: a theme's voice replaces any of it. */
export type Voice = {
  /** A placed digit. */
  place(digit: number): void;
  /** Rows, columns, boxes or a digit set finished at once (`finished` of them). */
  complete(finished: number): void;
  /** A new game dealt in. */
  deal(): void;
  pencil(): void;
  hint(): void;
  /** A refused digit. */
  miss(): void;
  /** A solved board. */
  win(): void;
  /** A secret's surprise, by its name ("arrive" for a season's arrival), so a theme can give each its own sound. */
  secret(surprise: string): void;
};

/** Aurora's voice, the default for every sound a theme leaves out. */
export const AURORA_VOICE: Voice = {
  /** A placed digit: a soft pop, higher for higher digits. */
  place(digit: number) {
    tone(note(digit - 1), null, 0, 0.14, "sine", 0.35);
    tone(note(digit - 1) * 2, null, 0, 0.04, "triangle", 0.08);
  },
  /** Rows, columns, boxes or a digit set finished at once: a chime of that many notes and one more. */
  complete(finished: number) {
    for (let k = 0; k <= finished; k++) tone(note(4 + k * 2), null, k * 0.06, 0.22, "sine", 0.28);
  },
  /** A new game dealt in: a soft run of ticks rising like reels landing. */
  deal() {
    for (let k = 0; k < 9; k++) tone(note(k), null, 0.18 + k * 0.07, 0.06, "triangle", 0.14);
  },
  pencil() {
    tone(2200, null, 0, 0.02, "sine", 0.1);
  },
  hint() {
    tone(note(7), note(9), 0, 0.26, "sine", 0.28);
  },
  miss() {
    tone(233, 165, 0, 0.2, "triangle", 0.4);
  },
  /** A solved board: the reels' arpeggio, then a bright chord as the fireworks go up. */
  win() {
    [0, 1, 2, 3, 4, 5, 6, 7, 8].forEach((k) => tone(note(k), null, k * 0.07, 0.3, "sine", 0.3));
    [4, 6, 8, 10].forEach((k) => tone(note(k), null, 0.75, 0.9, "triangle", 0.18));
  },
  /** A secret: a quick sparkle running up the top of the scale. */
  secret() {
    [6, 8, 10, 9, 10].forEach((k, i) => tone(note(k), null, i * 0.06, 0.18, "sine", 0.22));
    tone(note(10) * 2, null, 0.32, 0.4, "triangle", 0.08);
  },
};

let voice: Voice = AURORA_VOICE;

/** The theme's voice from now on (what it leaves out stays Aurora's). */
export function setVoice(next: Partial<Voice> | undefined) {
  voice = { ...AURORA_VOICE, ...next };
}

/** The game's sounds, in the current theme's voice. */
export const sound: Voice = {
  place: (digit) => voice.place(digit),
  complete: (finished) => voice.complete(finished),
  deal: () => voice.deal(),
  pencil: () => voice.pencil(),
  hint: () => voice.hint(),
  miss: () => voice.miss(),
  win: () => voice.win(),
  secret: (surprise) => voice.secret(surprise),
};

/** A tap for a placement or a mark; a double for a refused digit or a finished row, column or box. */
export function haptic(kind: "tap" | "double") {
  if (typeof navigator.vibrate === "function") {
    navigator.vibrate(kind === "tap" ? 8 : [16, 60, 16]);
    return;
  }
  if (!matchMedia("(pointer: coarse)").matches) return;
  switchTick();
  if (kind === "double") setTimeout(switchTick, 110);
}

function switchTick() {
  const label = document.createElement("label");
  label.ariaHidden = "true";
  label.style.display = "none";
  const input = document.createElement("input");
  input.type = "checkbox";
  input.setAttribute("switch", "");
  label.appendChild(input);
  document.head.appendChild(label);
  label.click();
  label.remove();
}
