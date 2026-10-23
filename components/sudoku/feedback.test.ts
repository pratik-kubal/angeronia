import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The synth in a browser that starts its AudioContext suspended, as WebKit does in the waking tap:
// the notes asked for before it runs wait for it (fresh ones only, as far apart as they were asked
// for, and every theme's phrases whole), and every note after plays at once.

type Feedback = typeof import("./feedback");

const param = () => ({ value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {} });

/** An AudioContext that records every note started (its frequency and start time), and runs when told to. */
class FakeContext extends EventTarget {
  static made: FakeContext[] = [];
  state: AudioContextState = "suspended";
  currentTime = 0;
  destination = {};
  started: number[] = [];
  times: number[] = [];
  resumes = 0;
  resumeFails = false;
  constructor() {
    super();
    FakeContext.made.push(this);
  }
  createGain() {
    return { gain: param(), connect: (node: unknown) => node };
  }
  createOscillator() {
    let freq = 0;
    return {
      type: "sine",
      frequency: { ...param(), setValueAtTime: (f: number) => (freq = f) },
      connect: (node: unknown) => node,
      start: (t: number) => {
        this.started.push(freq);
        this.times.push(t);
      },
      stop() {},
    };
  }
  resume() {
    this.resumes++;
    return this.resumeFails ? Promise.reject(new Error("not allowed")) : Promise.resolve();
  }
  /** The context starts (or comes back) running. */
  run() {
    this.state = "running";
    this.dispatchEvent(new Event("statechange"));
  }
}

let now = 0;
let fx: Feedback;

beforeEach(async () => {
  FakeContext.made = [];
  now = 1000;
  vi.stubGlobal("window", { AudioContext: FakeContext });
  vi.spyOn(performance, "now").mockImplementation(() => now);
  vi.resetModules();
  fx = await import("./feedback");
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const ctx = () => FakeContext.made[0];
const note = (freq: number) => fx.tone(freq, null, 0, 0.1, "sine", 0.3);

/** Every theme's own voice (Aurora's is the default), bound to this test's synth. */
async function themeVoices() {
  const [beach, blossom, candy, halloween, snow] = await Promise.all([
    import("./themes/beach/voice"),
    import("./themes/blossom/voice"),
    import("./themes/candy/voice"),
    import("./themes/halloween/voice"),
    import("./themes/snow/voice"),
  ]);
  return {
    aurora: undefined,
    beach: beach.BEACH_VOICE,
    blossom: blossom.blossomVoice,
    candy: candy.CANDY_VOICE,
    halloween: halloween.halloweenVoice,
    snow: snow.snowVoice,
  };
}

describe("the synth", () => {
  it("keeps the waking tap's notes until the context runs, then plays them in order", () => {
    fx.unlockAudio();
    note(440);
    note(550);
    expect(ctx().started).toEqual([]);
    now += 120;
    ctx().run();
    expect(ctx().started).toEqual([440, 550]);
  });

  it("plays waiting notes as far apart as they were asked for", () => {
    fx.unlockAudio();
    note(440);
    now += 90;
    note(550);
    now += 60;
    ctx().run();
    expect(ctx().times).toEqual([0, 0.09]);
  });

  it("plays every note at once while the context runs, and stops asking it to resume", () => {
    fx.unlockAudio();
    ctx().run();
    note(660);
    expect(ctx().started).toEqual([660]);
    fx.unlockAudio();
    expect(ctx().resumes).toBe(1);
  });

  it("plays the waiting notes first when the context runs before it says so", () => {
    // WebKit sets the state at once and fires statechange in a task of its own.
    fx.unlockAudio();
    note(440);
    ctx().state = "running";
    now += 50;
    note(550);
    expect(ctx().started).toEqual([440, 550]);
    expect(ctx().times).toEqual([0, 0.05]);
    ctx().run();
    expect(ctx().started).toEqual([440, 550]);
  });

  it("drops a note that waited too long, so a late start never plays a backlog", () => {
    fx.unlockAudio();
    note(440);
    now += 200;
    note(550);
    now += 150;
    ctx().run();
    expect(ctx().started).toEqual([550]);
    expect(ctx().times).toEqual([0]);
  });

  it("keeps only the latest notes when too many wait", () => {
    fx.unlockAudio();
    for (let k = 1; k <= 70; k++) note(k);
    ctx().run();
    expect(ctx().started).toEqual(Array.from({ length: 64 }, (_, i) => i + 7));
  });

  it("keeps every theme's deal and win whole while they wait", async () => {
    fx.unlockAudio();
    ctx().run();
    for (const [id, voice] of Object.entries(await themeVoices())) {
      fx.setVoice(voice);
      for (const phrase of ["deal", "win"] as const) {
        const before = ctx().started.length;
        fx.sound[phrase]();
        const notes = ctx().started.length - before;
        ctx().state = "suspended";
        fx.sound[phrase]();
        now += 100;
        ctx().run();
        expect(ctx().started.length - before - notes, `${id}'s ${phrase}`).toBe(notes);
        now += 1000;
      }
    }
  });

  it("plays a waiting note once, even when the context stops and runs again", () => {
    fx.unlockAudio();
    note(440);
    ctx().run();
    ctx().state = "interrupted" as AudioContextState;
    ctx().run();
    expect(ctx().started).toEqual([440]);
  });

  it("keeps the notes asked for while an interruption lasts, as on a return from the background", () => {
    fx.unlockAudio();
    ctx().run();
    ctx().state = "interrupted" as AudioContextState;
    note(330);
    expect(ctx().started).toEqual([]);
    now += 50;
    ctx().run();
    expect(ctx().started).toEqual([330]);
  });

  it("sounds nothing before the first gesture, and keeps nothing for later", () => {
    note(440);
    expect(FakeContext.made).toHaveLength(0);
    fx.unlockAudio();
    ctx().run();
    expect(ctx().started).toEqual([]);
  });

  it("makes one context, and a failed resume waits quietly for the next tap", async () => {
    const unhandled = vi.fn();
    process.on("unhandledRejection", unhandled);
    try {
      fx.unlockAudio();
      ctx().resumeFails = true;
      fx.unlockAudio();
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(unhandled).not.toHaveBeenCalled();
      ctx().resumeFails = false;
      fx.unlockAudio();
      expect(FakeContext.made).toHaveLength(1);
      expect(ctx().resumes).toBe(3);
      ctx().run();
      note(440);
      expect(ctx().started).toEqual([440]);
    } finally {
      process.off("unhandledRejection", unhandled);
    }
  });

  it("does nothing where there is no Web Audio", () => {
    vi.stubGlobal("window", {});
    fx.unlockAudio();
    note(440);
    expect(FakeContext.made).toHaveLength(0);
  });
});
