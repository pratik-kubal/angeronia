import { haptic, scaleNote, semis, tone } from "@/components/sudoku/feedback";

// Color Tap's sounds and touch, built on Sudoku's synth (ADR-022): tone() and unlockAudio() carry
// the iOS unlock and the waking tap's queue (components/sudoku/feedback.ts says how), haptic() the
// vibration and the switch tick, so this file is only the recipes. Sudoku's own voice and setVoice()
// are not used. Every note is in C major pentatonic from C5, as Sudoku's are, so two sounds that
// overlap always agree. Loudness goes by how often a sound is heard: the pop, heard hundreds of times
// a painting, is the shortest and softest; the finished picture's fanfare, heard once, is the only
// long one. Variety comes from the climb up the scale, not from chance: only the pop is jittered,
// by less than an eighth of a tone, and the wrong tap, the chimes and the fanfare sound the same
// every time. tone() has no noise and no reverb, so the magnifier's whoosh is a soft glide and a
// sparkle is quick high notes. Time is performance.now(), read when a sound is asked for.

export { unlockAudio } from "@/components/sudoku/feedback";

/** C major pentatonic from C5 to E7, in semitones: the climb is steps 0–8 (C5 to G6), sparkles reach the top. */
const KEY = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24, 26, 28];
/** Step `k` of the key from C5. */
const note = (k: number) => scaleNote(KEY, 523.25, k);
/** G4 and E4, below the key's first step: the magnifier's glide starts on one, the empty blip falls to the other. */
const G4 = semis(note(0), -5);
const E4 = semis(note(0), -8);

/** A random value in [-width, width]. */
const spread = (width: number) => (Math.random() * 2 - 1) * width;
const mod = (n: number, m: number) => ((n % m) + m) % m;

/** A paint this soon after the last one climbs a step; a longer rest starts again from C5. */
const CLIMB_MS = 1600;
/** The top of the climb, G6: past it the pop rocks between E6 and G6 rather than going shrill. */
const CLIMB_TOP = 8;
/** The pop's jitter: at most this many cents, and this fraction of its level, either way. */
const POP_CENTS = 12;
const POP_LEVEL = 0.08;

/** A bonk this soon after the last one is dropped. */
const WRONG_MS = 350;
/** The third bonk (and on) within this long plays at WRONG_SOFTER: a run of wrong taps never escalates. */
const WRONG_RUN_MS = 2000;
const WRONG_SOFTER = 0.6;

/** The colour chime's motif, E5 G5 C6 E6, as steps of the key; each finished colour lifts it a step, for five. */
const MOTIF = [2, 3, 5, 7];
const MOTIF_LIFTS = 5;

/** The fanfare's sparkles, as steps of the key (C6 to E7): fixed, so the hero sound is a motif too. */
const SHOWER = [10, 7, 12, 9, 11, 8, 10, 6, 12, 9, 7, 11, 8, 10, 5, 9];
/** Their lengths, in turn: some glints, some rings. */
const SHOWER_RINGS = [0.12, 0.25, 0.18];

/** The magnifier's glide, three overlapping breaths that swell and fade, with each one's level. */
const BREATHS = [0.03, 0.045, 0.03];
/** A flight shorter than this (a jump, for reduced motion) gets no glide, only the arrival's sparkle. */
const GLIDE_MIN_S = 0.15;
/** The arrival's sparkle, G6 C7 D7 E7 40 ms apart: [step of the key, level]. */
const ARRIVAL: readonly (readonly [number, number])[] = [
  [8, 0.045],
  [10, 0.04],
  [11, 0.035],
  [12, 0.03],
];

/** Auto-paint's beat: ticks land on this grid (sixteenths at about 143 BPM), at most one a slot. */
const GRID_MS = 105;
/** A rest longer than this (longer than the pause between colours) ends a run: the next starts a new grid. */
const AUTO_REST_MS = 600;
/** The ticks' path over the key, up and back with no jump at the turn. */
const PING_PONG = [0, 1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1];
/** After two seconds of ticks a run settles, over half a second or so, to DUCK_TO of its level. */
const DUCK_AFTER_MS = 2000;
const DUCK_MS = 500;
const DUCK_TO = 0.7;

/** The pop's climb: how many paints in a row came within CLIMB_MS of the one before (0 for the first), and when the last did. */
let climb = { run: 0, at: -Infinity };
/** When the bonks of the last WRONG_RUN_MS played. */
let bonks: number[] = [];
/** Auto-paint's run: when its grid starts, the latest slot given a tick, and how many ticks it has played. */
let auto = { from: -Infinity, slot: 0, played: 0 };

/** The climb's step for a paint now. */
function climbStep(now: number) {
  climb = { run: now - climb.at <= CLIMB_MS ? climb.run + 1 : 0, at: now };
  if (climb.run <= CLIMB_TOP) return climb.run;
  return (climb.run - CLIMB_TOP) % 2 === 1 ? CLIMB_TOP - 1 : CLIMB_TOP;
}

/** A marimba-like strike: a sine body, its two-octave overtone (a marimba's bars are tuned to it) and a soft octave. */
function marimba(freq: number, delay: number, gain: number) {
  tone(freq, null, delay, 0.45, "sine", gain);
  tone(freq * 4, null, delay, 0.06, "sine", gain * 0.18);
  tone(freq * 2, null, delay, 0.12, "triangle", gain * 0.2);
}

/** A run of ticks settles once it has gone on for DUCK_AFTER_MS, so a long auto-paint sits back. */
function duck(elapsed: number) {
  if (elapsed <= DUCK_AFTER_MS) return 1;
  return DUCK_TO + (1 - DUCK_TO) * Math.exp(-(elapsed - DUCK_AFTER_MS) / DUCK_MS);
}

/** Everything Color Tap sounds. */
export type Sound = {
  /** An area painted: a soft pop a step higher than the last while the paints keep coming. */
  pop(): void;
  /** A tap on another colour's area: a gentle low bonk, never a buzzer. */
  wrong(): void;
  /** A colour picked: a tiny tick, and the pop's climb starts again. */
  select(): void;
  /** A colour finished (`finished` colours are done now): the colour chime. */
  colourDone(finished: number): void;
  /** The whole picture painted: the fanfare. */
  pictureDone(): void;
  /** A magnifier flight of `ms`: a glide across it, a sparkle on arrival. */
  magnify(ms: number): void;
  /** The magnifier with no uses left. */
  empty(): void;
  /** An area auto-painted: a tick on auto-paint's beat. */
  autoTick(): void;
};

export const sound: Sound = {
  /**
   * An area painted: a quick glide up into the note (a blob of paint landing), done by 150 ms, with
   * a quiet triangle an octave up so a phone's speaker carries it. Each paint within 1.6 s of the
   * last climbs a step of the key from C5, up to G6; a rest or a new colour starts again from C5.
   * A wrong tap leaves the climb alone (the owner's ruling: no penalties).
   */
  pop() {
    const f = semis(note(climbStep(performance.now())), spread(POP_CENTS) / 100);
    const g = 1 + spread(POP_LEVEL);
    tone(f * 0.82, f, 0, 0.03, "sine", 0.22 * g);
    tone(f, null, 0.006, 0.144, "sine", 0.26 * g);
    tone(f * 2, null, 0, 0.045, "triangle", 0.07 * g);
  },
  /** A tap on another colour's area: a triangle falling E4 to B3, with its octave for a phone's speaker. */
  wrong() {
    const now = performance.now();
    if (bonks.length > 0 && now - bonks[bonks.length - 1] < WRONG_MS) return;
    bonks = bonks.filter((at) => now - at < WRONG_RUN_MS);
    const g = bonks.length >= 2 ? WRONG_SOFTER : 1;
    bonks.push(now);
    tone(330, 247, 0, 0.18, "triangle", 0.18 * g);
    tone(660, 494, 0, 0.18, "sine", 0.04 * g);
  },
  /** A colour picked: a tick on C6, quieter than anything but auto-paint's. */
  select() {
    climb = { run: 0, at: -Infinity };
    tone(note(5), null, 0, 0.045, "sine", 0.08);
    tone(note(10), null, 0, 0.02, "triangle", 0.02);
  },
  /**
   * A colour finished: E5 G5 C6 E6 struck 70 ms apart, then a glint on C7. The motif never changes,
   * so it is known at once; it only moves up a step of the key per finished colour, from the first,
   * and comes back down after five.
   */
  colourDone(finished) {
    const lift = mod(finished - 1, MOTIF_LIFTS);
    MOTIF.forEach((k, i) => marimba(note(k + lift), i * 0.07, i === MOTIF.length - 1 ? 0.19 : 0.17));
    tone(note(10), null, 0.28, 0.7, "triangle", 0.035);
  },
  /**
   * The whole picture: the one hero sound, about 2.4 s. A quick run up the key from C5 to G6, then
   * a Cadd9 bloom (C5 G5 D6 E6) over a low C4 that earbuds carry, while sparkles fall from 0.7 s.
   * 48 notes, so it waits whole in Sudoku's queue (64) if the context is still waking.
   */
  pictureDone() {
    for (let k = 0; k <= CLIMB_TOP; k++) marimba(note(k), k * 0.055, 0.15 + (0.05 * k) / CLIMB_TOP);
    [0, 3, 6, 7].forEach((k) => tone(note(k), null, 0.6, 1.8, "triangle", 0.06));
    tone(note(0) / 2, null, 0.6, 1.2, "sine", 0.09);
    SHOWER.forEach((k, i) => {
      const gain = 0.045 - (0.025 * i) / (SHOWER.length - 1);
      tone(note(k), null, 0.7 + i * 0.082, SHOWER_RINGS[i % SHOWER_RINGS.length], "sine", gain);
    });
  },
  /**
   * A magnifier flight of `ms`: a soft triangle gliding G4 to C6 across the whole flight, in three
   * breaths that overlap so it never stops (the middle one loudest, so it swells mid-flight), then
   * a small sparkle as the area arrives in the middle of the screen.
   */
  magnify(ms) {
    const flight = Math.max(ms, 0) / 1000;
    if (flight >= GLIDE_MIN_S) {
      const pitch = (x: number) => G4 * (note(5) / G4) ** Math.min(x, 1);
      const part = flight / BREATHS.length;
      BREATHS.forEach((gain, i) => {
        const start = i * part;
        // Each breath lasts half as long again as its share; the last rings on past arrival.
        const dur = i < BREATHS.length - 1 ? part * 1.5 : flight - start + 0.12;
        tone(pitch(start / flight), pitch((start + dur) / flight), start, dur, "triangle", gain);
      });
    }
    ARRIVAL.forEach(([k, gain], i) => tone(note(k), null, flight + i * 0.04, 0.18, "sine", gain));
  },
  /** The magnifier with no uses left: a short soft blip falling G4 to E4, with its octave for a phone's speaker. */
  empty() {
    tone(G4, E4, 0, 0.09, "sine", 0.1);
    tone(G4 * 2, E4 * 2, 0, 0.09, "sine", 0.04);
  },
  /**
   * An area auto-painted. Auto-paint fills far faster than notes should come, so the ticks keep
   * their own beat: a run's first tick plays at once, and each later one waits for the next free
   * slot of a 105 ms grid from it. A tick asked for in a slot that has one already is dropped. The
   * ticks walk up the key and back down; a rest of over 600 ms ends the run, and the next starts a
   * new grid from C5.
   */
  autoTick() {
    const now = performance.now();
    if (now - (auto.from + auto.slot * GRID_MS) > AUTO_REST_MS) auto = { from: now, slot: -1, played: 0 };
    const slot = Math.ceil((now - auto.from) / GRID_MS);
    if (slot <= auto.slot) return;
    const at = auto.from + slot * GRID_MS;
    const f = note(PING_PONG[auto.played % PING_PONG.length]);
    const g = duck(at - auto.from);
    auto = { from: auto.from, slot, played: auto.played + 1 };
    tone(f, null, (at - now) / 1000, 0.07, "sine", 0.1 * g);
    tone(f * 2, null, (at - now) / 1000, 0.05, "triangle", 0.025 * g);
  },
};

/**
 * A tap for a paint or a picked colour; a double for a finished colour. Sudoku's haptics: a
 * vibration on Android, the switch tick on iOS, which ticks only inside a real tap, so call it
 * from the tap's own handler and never from a timer.
 */
export function feel(kind: "tap" | "double") {
  haptic(kind);
}
