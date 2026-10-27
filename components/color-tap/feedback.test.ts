import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Color Tap's recipes, played into a stand-in for Sudoku's synth that records every note asked for
// (its scale helpers are the real ones). What is proven: the pop climbs C major pentatonic one step
// per paint while the paints come within 1.6 s of each other, rocks between its top two notes at the
// cap, and starts again from C5 after a rest or a picked colour, but never after a wrong tap; the
// bonk plays at most once per 350 ms and grows softer, never louder, when wrong taps keep coming;
// auto-paint's ticks land on a 105 ms grid, one per slot, ping-ponging over the scale; the colour
// chime is one motif lifted a step per finished colour and wrapping after five; the fanfare and the
// magnifier are phrases of several notes, the magnifier's timed to its flight; feel() is Sudoku's
// haptic; and every sound is in key, modest, never scheduled in the past, and short enough to wait
// whole in Sudoku's queue.

type Tone = (freq: number, glideTo: number | null, delay: number, dur: number, type: OscillatorType, gain: number) => void;

const synth = vi.hoisted(() => ({
  tone: vi.fn<Tone>(),
  unlockAudio: vi.fn<() => void>(),
  haptic: vi.fn<(kind: "tap" | "double") => void>(),
}));

vi.mock("@/components/sudoku/feedback", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/components/sudoku/feedback")>()),
  ...synth,
}));

type Note = { freq: number; glideTo: number | null; delay: number; dur: number; type: OscillatorType; gain: number };

/** C major pentatonic from C5, in Hz: the climb's steps 0–8 (C5 to G6), then on up to E7. */
const KEY_HZ = [523.25, 587.33, 659.26, 783.99, 880, 1046.5, 1174.66, 1318.51, 1567.98, 1760, 2093, 2349.32, 2637.02];
/** The step of the key `hz` is, or -1 if it is none of them. */
const stepOf = (hz: number) => KEY_HZ.findIndex((k) => Math.abs(k - hz) < 0.05);
const mod = (n: number, m: number) => ((n % m) + m) % m;

/** Whether `hz` is a note of C major pentatonic (C D E G A) in any octave. */
function inKey(hz: number) {
  const semitones = 12 * Math.log2(hz / 523.25);
  const nearest = Math.round(semitones);
  return Math.abs(semitones - nearest) < 0.01 && [0, 2, 4, 7, 9].includes(mod(nearest, 12));
}

const START = 10_000;
let now = START;
let fx: typeof import("./feedback");

beforeEach(async () => {
  now = START;
  vi.spyOn(performance, "now").mockImplementation(() => now);
  vi.spyOn(Math, "random").mockReturnValue(0.5);
  synth.tone.mockClear();
  synth.unlockAudio.mockClear();
  synth.haptic.mockClear();
  vi.resetModules();
  fx = await import("./feedback");
});

afterEach(() => {
  vi.restoreAllMocks();
});

/** The notes `play` asks the synth for. */
function heard(play: () => void): Note[] {
  synth.tone.mockClear();
  play();
  return synth.tone.mock.calls.map(([freq, glideTo, delay, dur, type, gain]) => ({ freq, glideTo, delay, dur, type, gain }));
}

/** The note a sound holds: its loudest sine that does not glide. */
const held = (notes: Note[]) =>
  notes.filter((n) => n.type === "sine" && n.glideTo === null).reduce((a, b) => (b.gain > a.gain ? b : a));

/** For each moment a phrase strikes, the loudest note struck then, in time order. */
function strikes(notes: Note[]): Note[] {
  const byDelay = new Map<number, Note>();
  for (const n of notes) {
    const key = Math.round(n.delay * 1000);
    const loudest = byDelay.get(key);
    if (!loudest || n.gain > loudest.gain) byDelay.set(key, n);
  }
  return [...byDelay.entries()].sort(([a], [b]) => a - b).map(([, n]) => n);
}

/** When a phrase's last note has died away, in seconds from the call. */
const end = (notes: Note[]) => Math.max(...notes.map((n) => n.delay + n.dur));

/** A pop `ms` into the test, as the step of the key it plays. */
function popAt(ms: number) {
  now = START + ms;
  return stepOf(held(heard(() => fx.sound.pop())).freq);
}

/** A wrong tap `ms` into the test, as the notes it played (none when it was dropped). */
function wrongAt(ms: number) {
  now = START + ms;
  return heard(() => fx.sound.wrong());
}

/** An auto-paint tick asked for `ms` into the test: when it sounds (ms into the test) and its step, or null if dropped. */
function tickAt(ms: number) {
  now = START + ms;
  const notes = heard(() => fx.sound.autoTick());
  if (notes.length === 0) return null;
  const tick = held(notes);
  return { at: Math.round(ms + tick.delay * 1000), step: stepOf(tick.freq), gain: tick.gain };
}

/** Every sound the game makes, once each, as the notes they asked for. */
function everySound(): Note[] {
  return heard(() => {
    for (let k = 0; k < 12; k++) {
      now = START + k * 100;
      fx.sound.pop();
    }
    now = START + 5_000;
    fx.sound.wrong();
    fx.sound.select();
    for (let finished = 1; finished <= 6; finished++) fx.sound.colourDone(finished);
    fx.sound.pictureDone();
    fx.sound.magnify(450);
    fx.sound.magnify(1200);
    fx.sound.magnify(0);
    fx.sound.empty();
    for (let k = 0; k < 40; k++) {
      now = START + 10_000 + k * 105;
      fx.sound.autoTick();
    }
  });
}

describe("the pop", () => {
  it("climbs one step of C major pentatonic per paint, from C5 to G6", () => {
    expect([0, 200, 400, 600, 800, 1000, 1200, 1400, 1600].map(popAt)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it("rocks between E6 and G6 once it reaches the top, rather than going shrill", () => {
    const steps = Array.from({ length: 14 }, (_, k) => popAt(k * 150));
    expect(steps).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 7, 8, 7, 8, 7]);
  });

  it("keeps climbing while each paint comes within 1.6 s of the last, however long the run", () => {
    expect([0, 1600, 3200, 4800].map(popAt)).toEqual([0, 1, 2, 3]);
  });

  it("starts again from C5 after a rest longer than 1.6 s", () => {
    expect([0, 500, 1000, 2601, 2700].map(popAt)).toEqual([0, 1, 2, 0, 1]);
  });

  it("starts again from C5 when a colour is picked", () => {
    expect([0, 100, 200].map(popAt)).toEqual([0, 1, 2]);
    fx.sound.select();
    expect([300, 400].map(popAt)).toEqual([0, 1]);
  });

  it("is never reset by a wrong tap, which is not a penalty", () => {
    expect([0, 100].map(popAt)).toEqual([0, 1]);
    wrongAt(150);
    expect(popAt(200)).toBe(2);
    wrongAt(250);
    wrongAt(700);
    expect(popAt(800)).toBe(3);
  });

  it("does not let a wrong tap keep a climb alive past its rest", () => {
    popAt(0);
    popAt(100);
    wrongAt(1000);
    expect(popAt(1800)).toBe(0);
  });

  it("glides up from 0.82 of its note to the note, with a quiet triangle an octave up, all done by 150 ms", () => {
    now = START;
    const notes = heard(() => fx.sound.pop());
    const f = held(notes).freq;
    expect(f).toBeCloseTo(523.25, 1);
    const glide = notes.find((n) => n.glideTo !== null);
    expect(glide?.freq).toBeCloseTo(0.82 * f, 3);
    expect(glide?.glideTo).toBeCloseTo(f, 3);
    expect(glide?.dur).toBeLessThanOrEqual(0.03);
    const bright = notes.find((n) => n.type === "triangle");
    expect(bright?.freq).toBeCloseTo(2 * f, 3);
    expect(bright?.gain).toBeLessThan(held(notes).gain / 2);
    expect(end(notes)).toBeCloseTo(0.15, 3);
  });

  it("is jittered by at most 12 cents and 8% of its level, all of its notes together", () => {
    const level = held(heard(() => fx.sound.pop())).gain;
    // Each pop after a rest, so every one is C5 before its jitter: chance at its lowest, then its highest.
    [0, 0.999999].forEach((chance, i) => {
      vi.spyOn(Math, "random").mockReturnValue(chance);
      now = START + (i + 1) * 5000;
      const notes = heard(() => fx.sound.pop());
      const body = held(notes);
      const cents = 1200 * Math.log2(body.freq / 523.25);
      expect(Math.sign(cents)).toBe(chance < 0.5 ? -1 : 1);
      expect(Math.abs(cents)).toBeGreaterThan(11.9);
      expect(Math.abs(cents)).toBeLessThanOrEqual(12 + 1e-9);
      expect(Math.abs(body.gain / level - 1)).toBeGreaterThan(0.079);
      expect(Math.abs(body.gain / level - 1)).toBeLessThanOrEqual(0.08 + 1e-9);
      expect(notes.find((n) => n.glideTo !== null)?.glideTo).toBeCloseTo(body.freq, 6);
      expect(notes.find((n) => n.type === "triangle")?.freq).toBeCloseTo(2 * body.freq, 6);
    });
  });
});

describe("the wrong tap", () => {
  it("bonks low and gently: a triangle falling 330 to 247 Hz, with its octave above for a phone's speaker", () => {
    const notes = wrongAt(0);
    const bonk = notes.find((n) => n.type === "triangle");
    expect(bonk).toMatchObject({ freq: 330, glideTo: 247, delay: 0 });
    expect(bonk?.dur).toBeGreaterThanOrEqual(0.16);
    expect(bonk?.dur).toBeLessThanOrEqual(0.2);
    expect(notes.find((n) => n.type === "sine")).toMatchObject({ freq: 660, glideTo: 494 });
    expect(Math.max(...notes.map((n) => n.gain))).toBeLessThanOrEqual(0.2);
  });

  it("plays at most once per 350 ms, counted from the last one heard", () => {
    const played = [0, 100, 349, 350, 500, 699, 700].filter((ms) => wrongAt(ms).length > 0);
    expect(played).toEqual([0, 350, 700]);
  });

  it("grows softer, never louder, when wrong taps keep coming, and is itself again after a rest", () => {
    const level = (ms: number) => Math.max(...wrongAt(ms).map((n) => n.gain));
    const first = level(0);
    expect(level(400)).toBeCloseTo(first, 6);
    expect(level(800)).toBeCloseTo(first * 0.6, 6);
    expect(level(1200)).toBeCloseTo(first * 0.6, 6);
    expect(level(5000)).toBeCloseTo(first, 6);
  });

  it("sounds the same every time, whatever chance says", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const a = wrongAt(0);
    vi.spyOn(Math, "random").mockReturnValue(0.999999);
    expect(wrongAt(5000)).toEqual(a);
  });
});

describe("picking a colour", () => {
  it("ticks: short, soft and in key", () => {
    const notes = heard(() => fx.sound.select());
    expect(notes.length).toBeGreaterThan(0);
    expect(end(notes)).toBeLessThanOrEqual(0.05);
    expect(Math.max(...notes.map((n) => n.gain))).toBeLessThanOrEqual(0.1);
    expect(notes.every((n) => n.glideTo === null && inKey(n.freq))).toBe(true);
  });
});

describe("a finished colour", () => {
  /** The chime's four struck notes, as steps of the key, and when each is struck. */
  const motif = (finished: number) => {
    const struck = strikes(heard(() => fx.sound.colourDone(finished))).slice(0, 4);
    return { steps: struck.map((n) => stepOf(n.freq)), delays: struck.map((n) => n.delay) };
  };

  it("strikes E5 G5 C6 E6, 70 ms apart, for the first colour", () => {
    const { steps, delays } = motif(1);
    expect(steps).toEqual([2, 3, 5, 7]);
    delays.forEach((d, i) => expect(d).toBeCloseTo(i * 0.07, 6));
  });

  it("lifts the same motif one step of the key per finished colour", () => {
    expect([1, 2, 3, 4, 5].map((finished) => motif(finished).steps)).toEqual([
      [2, 3, 5, 7],
      [3, 4, 6, 8],
      [4, 5, 7, 9],
      [5, 6, 8, 10],
      [6, 7, 9, 11],
    ]);
  });

  it("comes back down after five colours", () => {
    expect(motif(6)).toEqual(motif(1));
    expect(motif(7)).toEqual(motif(2));
    expect(motif(10)).toEqual(motif(5));
    expect(motif(11)).toEqual(motif(1));
  });

  it("is a phrase under a second long, and the same every time, whatever chance says", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const a = heard(() => fx.sound.colourDone(3));
    vi.spyOn(Math, "random").mockReturnValue(0.999999);
    expect(heard(() => fx.sound.colourDone(3))).toEqual(a);
    expect(end(a)).toBeLessThanOrEqual(1);
  });

  it("leaves the pop's climb alone", () => {
    expect([0, 100].map(popAt)).toEqual([0, 1]);
    fx.sound.colourDone(1);
    expect(popAt(200)).toBe(2);
  });
});

describe("the finished picture", () => {
  it("runs up the key from C5 to G6, quickly", () => {
    const run = strikes(heard(() => fx.sound.pictureDone())).filter((n) => n.delay < 0.5);
    expect(run.map((n) => stepOf(n.freq))).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
    expect(run[run.length - 1].delay).toBeLessThan(0.5);
  });

  it("blooms into a chord after the run, then sparkles high, for about 2.4 s in all", () => {
    const notes = heard(() => fx.sound.pictureDone());
    const bloom = notes.filter((n) => Math.abs(n.delay - 0.6) < 1e-9);
    expect(bloom.length).toBeGreaterThanOrEqual(4);
    expect(new Set(bloom.map((n) => n.freq)).size).toBe(bloom.length);
    const sparkles = notes.filter((n) => n.delay >= 0.7);
    expect(sparkles.length).toBeGreaterThanOrEqual(10);
    expect(sparkles.every((n) => n.freq >= 1046 && n.dur <= 0.3)).toBe(true);
    expect(end(notes)).toBeGreaterThan(2.2);
    expect(end(notes)).toBeLessThanOrEqual(2.6);
  });

  it("waits whole in Sudoku's queue (64 notes) if the context is still waking", () => {
    expect(heard(() => fx.sound.pictureDone()).length).toBeLessThanOrEqual(64);
  });

  it("is the same every time, whatever chance says", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const a = heard(() => fx.sound.pictureDone());
    vi.spyOn(Math, "random").mockReturnValue(0.999999);
    expect(heard(() => fx.sound.pictureDone())).toEqual(a);
  });
});

describe("the magnifier", () => {
  const flight = (ms: number) => {
    const notes = heard(() => fx.sound.magnify(ms));
    return {
      glides: notes.filter((n) => n.glideTo !== null).sort((a, b) => a.delay - b.delay),
      sparkle: notes.filter((n) => n.glideTo === null).sort((a, b) => a.delay - b.delay),
    };
  };

  it("glides upward across the whole flight without a gap, swelling in the middle", () => {
    const { glides } = flight(800);
    expect(glides.length).toBeGreaterThanOrEqual(2);
    expect(glides[0].delay).toBe(0);
    expect(glides.every((g) => (g.glideTo ?? 0) > g.freq)).toBe(true);
    for (let i = 1; i < glides.length; i++) {
      expect(glides[i].delay).toBeLessThan(glides[i - 1].delay + glides[i - 1].dur);
      expect(glides[i].freq).toBeGreaterThan(glides[i - 1].freq);
    }
    expect(end(glides)).toBeGreaterThanOrEqual(0.8);
    const loudest = glides.reduce((a, b) => (b.gain > a.gain ? b : a));
    expect(loudest).not.toBe(glides[0]);
    expect(loudest).not.toBe(glides[glides.length - 1]);
  });

  it("sparkles high as the area arrives", () => {
    const { sparkle } = flight(800);
    expect(sparkle.length).toBeGreaterThanOrEqual(3);
    expect(sparkle[0].delay).toBeCloseTo(0.8, 6);
    expect(sparkle.every((n) => n.freq >= 1567)).toBe(true);
    expect(new Set(sparkle.map((n) => n.delay)).size).toBe(sparkle.length);
  });

  it("times the glide and the sparkle to each flight, short or long", () => {
    for (const ms of [450, 1200]) {
      const { glides, sparkle } = flight(ms);
      expect(sparkle[0].delay).toBeCloseTo(ms / 1000, 6);
      expect(end(glides)).toBeGreaterThanOrEqual(ms / 1000);
      expect(end(glides)).toBeLessThanOrEqual(ms / 1000 + 0.2);
    }
  });

  it("only sparkles when there is no flight to glide over (a jump, for reduced motion)", () => {
    const { glides, sparkle } = flight(0);
    expect(glides).toEqual([]);
    expect(sparkle[0].delay).toBe(0);
  });

  it("with no uses left, blips once: short, soft and falling", () => {
    const notes = heard(() => fx.sound.empty());
    expect(notes.length).toBeGreaterThan(0);
    expect(notes.every((n) => n.glideTo !== null && n.glideTo < n.freq)).toBe(true);
    expect(end(notes)).toBeLessThanOrEqual(0.1);
    expect(Math.max(...notes.map((n) => n.gain))).toBeLessThanOrEqual(0.1);
  });
});

describe("auto-paint's ticks", () => {
  it("plays a run's first tick at once and each later one on the next slot of a 105 ms grid", () => {
    expect(tickAt(0)).toMatchObject({ at: 0 });
    expect(tickAt(30)).toMatchObject({ at: 105 });
    expect(tickAt(140)).toMatchObject({ at: 210 });
    expect(tickAt(315)).toMatchObject({ at: 315 });
  });

  it("plays at most one tick a slot and drops the rest, however fast the areas fill", () => {
    const ticks = Array.from({ length: 101 }, (_, k) => tickAt(k * 10));
    expect(ticks.flatMap((t) => (t === null ? [] : [t.at]))).toEqual([0, 105, 210, 315, 420, 525, 630, 735, 840, 945, 1050]);
  });

  it("ping-pongs up the key and back down, never jumping", () => {
    const steps = Array.from({ length: 25 }, (_, k) => tickAt(k * 105)?.step);
    expect(steps).toEqual([0, 1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1, 0, 1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1, 0]);
  });

  it("keeps its beat and its place through the pause between colours", () => {
    [0, 105, 210].forEach(tickAt);
    expect(tickAt(470)).toEqual(expect.objectContaining({ at: 525, step: 3 }));
  });

  it("starts a new run, at once and from C5, after a longer rest", () => {
    [0, 105, 210].forEach(tickAt);
    expect(tickAt(1000)).toEqual(expect.objectContaining({ at: 1000, step: 0 }));
    expect(tickAt(1050)).toEqual(expect.objectContaining({ at: 1105, step: 1 }));
  });

  it("is quiet, and settles quieter after two seconds of ticks, but never fades out", () => {
    const ticks = Array.from({ length: 60 }, (_, k) => tickAt(k * 105));
    const gains = ticks.map((t) => t?.gain ?? 0);
    expect(Math.max(...gains)).toBeLessThanOrEqual(0.1);
    expect(gains[19]).toBeCloseTo(gains[0], 6);
    expect(gains[59]).toBeLessThan(gains[0] * 0.75);
    expect(gains[59]).toBeGreaterThanOrEqual(gains[0] * 0.7);
  });

  it("leaves the pop's climb alone", () => {
    expect([0, 100].map(popAt)).toEqual([0, 1]);
    tickAt(150);
    expect(popAt(200)).toBe(2);
  });
});

describe("feel and unlockAudio", () => {
  it("hands a tap and a double to Sudoku's haptics", () => {
    fx.feel("tap");
    fx.feel("double");
    expect(synth.haptic.mock.calls).toEqual([["tap"], ["double"]]);
  });

  it("wakes Sudoku's own audio, so both games share one context", () => {
    fx.unlockAudio();
    expect(synth.unlockAudio).toHaveBeenCalledTimes(1);
  });
});

describe("every sound", () => {
  it("holds only notes of C major pentatonic (glides pass between them)", () => {
    const off = everySound().filter((n) => n.glideTo === null && !inKey(n.freq));
    expect(off).toEqual([]);
  });

  it("stays modest under Sudoku's master gain: no note louder than 0.3, even at the pop's loudest jitter", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.999999);
    expect(Math.max(...everySound().map((n) => n.gain))).toBeLessThanOrEqual(0.3);
  });

  it("never asks for a note in the past, or one with no length", () => {
    const notes = everySound();
    expect(notes.every((n) => n.delay >= 0 && n.dur > 0 && n.gain > 0)).toBe(true);
  });
});
