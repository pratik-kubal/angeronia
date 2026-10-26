import { describe, expect, it } from "vitest";
import { mulberry32 } from "../random";
import type { Compiled } from "./compiled";
import { ROUTES, compiled } from "./routes";
import {
  ACCEL,
  COUNTDOWN,
  CRUISE,
  DIP,
  FINISH_BEFORE,
  GLOW_START,
  HIT,
  OFF_MAX,
  SLOW_OFF,
  STEP,
  STUCK_TICKS,
  TAIL_TICKS,
} from "./rules";
import { createSim, hashSim, raceTicks, step, type EventKind, type Input, type Sim } from "./sim";
import { testRoute } from "./test-routes";

const IDLE: Input = { steer: 0, hop: false };

/** Runs until `until` or the finish, collecting every event with its tick. */
function run(route: Compiled, input: (sim: Sim) => Input = () => IDLE, until?: (sim: Sim) => boolean, sim = createSim(route)) {
  const events: { kind: EventKind; item: number; tick: number }[] = [];
  for (let guard = 0; guard < 60 * 60 * 10 && sim.phase !== "finished"; guard++) {
    step(sim, input(sim), route);
    for (const e of sim.events) events.push({ ...e, tick: sim.tick });
    if (until?.(sim)) break;
  }
  return { sim, events, kinds: events.map((e) => e.kind) };
}

describe("a flat ribbon, left alone", () => {
  const route = testRoute();
  const { sim, kinds } = run(route);

  it("counts down, goes, and finishes once, at cruising speed", () => {
    expect(kinds[0]).toBe("go");
    expect(kinds.filter((k) => k === "finish")).toHaveLength(1);
    // Up to cruise, then the rest at cruise.
    const rampTime = CRUISE / ACCEL;
    const rampDistance = (CRUISE * rampTime) / 2;
    const expected = (rampTime + (route.track.length - FINISH_BEFORE - rampDistance) / CRUISE) / STEP;
    expect(Math.abs(raceTicks(sim) - expected)).toBeLessThanOrEqual(2);
    expect(sim.finishTick).toBe(COUNTDOWN + raceTicks(sim));
  });

  it("stands still through the countdown", () => {
    const fresh = createSim(route);
    for (let i = 0; i < COUNTDOWN - 1; i++) step(fresh, { steer: 1, hop: true }, route);
    expect(fresh.phase).toBe("countdown");
    expect([fresh.s, fresh.x, fresh.h]).toEqual([0, 0, 0]);
  });

  it("does nothing more once finished", () => {
    const before = hashSim(sim);
    step(sim, { steer: 1, hop: true }, route);
    expect(hashSim(sim)).toBe(before);
    expect(sim.events).toEqual([]);
  });
});

describe("steering", () => {
  const route = testRoute();

  it("moves right for a positive steer, and never further than its top speed allows", () => {
    const { sim } = run(route, () => ({ steer: 1, hop: false }), (s) => s.phase === "running" && s.tick === COUNTDOWN + 30);
    expect(sim.x).toBeGreaterThan(1.5);
    expect(sim.x).toBeLessThanOrEqual((7 * 30) / 60);
  });

  it("leaves the current past the edge, slows, and drifts back once let go", () => {
    let pushing = true;
    const { sim, kinds, events } = run(
      route,
      (s) => {
        if (s.off && s.vs <= SLOW_OFF + 0.01) pushing = false;
        return { steer: pushing ? 1 : 0, hop: false };
      },
      (s) => !pushing && !s.off,
    );
    expect(kinds).toContain("off");
    expect(kinds.at(-1)).toBe("back");
    expect(sim.x).toBeLessThanOrEqual(3);
    // Held outward, Wick stops at the drift's limit.
    const held = run(route, () => ({ steer: 1, hop: false }), (s) => s.tick === COUNTDOWN + 240).sim;
    expect(held.x).toBeCloseTo(3 + OFF_MAX, 6);
    expect(held.vs).toBeCloseTo(SLOW_OFF, 6);
    expect(events.find((e) => e.kind === "off")!.tick).toBeGreaterThan(COUNTDOWN);
  });
});

describe("hop", () => {
  const route = testRoute();

  it("rises and lands, and cannot hop again in the air", () => {
    let pressed = 0;
    const { kinds } = run(
      route,
      (s) => ({ steer: 0, hop: s.phase === "running" && pressed++ < 20 }),
      (s) => s.tick > COUNTDOWN + 60,
    );
    expect(kinds.filter((k) => k === "hop")).toHaveLength(1);
    expect(kinds.filter((k) => k === "land")).toHaveLength(1);
    expect(kinds.indexOf("hop")).toBeLessThan(kinds.indexOf("land"));
  });

  it("stays up about two thirds of a second and peaks about a metre up", () => {
    let top = 0;
    const { events } = run(
      route,
      (s) => {
        top = Math.max(top, s.h);
        return { steer: 0, hop: s.tick === COUNTDOWN + 30 };
      },
      (s) => s.tick > COUNTDOWN + 120,
    );
    const up = events.find((e) => e.kind === "hop")!.tick;
    const down = events.find((e) => e.kind === "land")!.tick;
    expect((down - up) * STEP).toBeGreaterThan(0.6);
    expect((down - up) * STEP).toBeLessThan(0.7);
    expect(top).toBeGreaterThan(1);
    expect(top).toBeLessThan(1.1);
  });
});

describe("a thread across the ribbon", () => {
  const route = testRoute([{ kind: "thread", s: 60 }]);

  it("holds Wick for exactly half a second without a hop", () => {
    const { events, sim } = run(route);
    const stuck = events.find((e) => e.kind === "stuck")!;
    const freed = events.find((e) => e.kind === "freed")!;
    expect(freed.tick - stuck.tick).toBe(STUCK_TICKS);
    expect(sim.glow).toBe(GLOW_START);
  });

  it("is cleared by a hop", () => {
    const { kinds } = run(route, (s) => ({ steer: 0, hop: s.s > 56 && s.s < 58 }));
    expect(kinds).not.toContain("stuck");
  });
});

describe("a gap", () => {
  const route = testRoute([], [{ len: 80 }, { len: 6, gap: true }, { len: 80 }]);

  it("dips Wick under it without a hop: a little glow and a little time, then on", () => {
    const { kinds, sim } = run(route);
    expect(kinds).toContain("dip");
    expect(kinds.indexOf("land")).toBeGreaterThan(kinds.indexOf("dip"));
    expect(sim.dips).toBe(1);
    expect(sim.glow).toBe(GLOW_START - DIP);
    expect(sim.phase).toBe("finished");
  });

  it("is cleared by a hop at cruise", () => {
    const { kinds, sim } = run(route, (s) => ({ steer: 0, hop: s.s > 77 && s.s < 79 }));
    expect(kinds).not.toContain("dip");
    expect(sim.dips).toBe(0);
  });

  it("still allows a hop just after the edge", () => {
    const { kinds } = run(route, (s) => ({ steer: 0, hop: s.s > 80.2 && s.s < 81 }));
    expect(kinds).not.toContain("dip");
  });

  it("is slower without the hop, by a moment", () => {
    const dipped = run(route).sim;
    const hopped = run(route, (s) => ({ steer: 0, hop: s.s > 77 && s.s < 79 })).sim;
    expect(raceTicks(dipped)).toBeGreaterThan(raceTicks(hopped) + 20);
    expect(raceTicks(dipped)).toBeLessThan(raceTicks(hopped) + 90);
  });
});

describe("pickups", () => {
  it("gathers each spark once and adds its glow", () => {
    const route = testRoute([
      { kind: "sparks", s: 30, n: 10 },
      { kind: "sparks", s: 60, n: 1, big: true },
    ]);
    const { sim, kinds } = run(route);
    expect(kinds.filter((k) => k === "spark")).toHaveLength(11);
    expect(sim.sparks).toBe(11);
    expect(sim.glow).toBe(GLOW_START + 10 + 3);
    expect(route.maxGlow).toBe(sim.glow);
  });

  it("misses sparks off to the side and high sparks without a hop", () => {
    const route = testRoute([
      { kind: "sparks", s: 30, n: 5, x: 2 },
      { kind: "sparks", s: 60, n: 1, x: 0, arc: 1 },
      { kind: "sparks", s: 60, n: 3, x: 0, arc: 1.2, every: 1 },
    ]);
    const { sim } = run(route);
    // The 3-spark arc's middle spark is 1.2 m up; its ends are on the ribbon.
    expect(sim.sparks).toBe(1 + 2);
  });

  it("rides a blossom's tailwind, then eases back to cruise", () => {
    const route = testRoute([{ kind: "blossom", s: 40, x: 0 }], [{ len: 400 }]);
    let fastest = 0;
    let picked = -1;
    const { sim } = run(
      route,
      (s) => {
        fastest = Math.max(fastest, s.vs);
        if (picked < 0 && s.tail > 0) picked = s.tick;
        return IDLE;
      },
      (s) => picked > 0 && s.tick > picked + TAIL_TICKS + 120,
    );
    expect(fastest).toBeGreaterThan(CRUISE + 6);
    expect(sim.vs).toBeCloseTo(CRUISE, 6);
  });

  it("lets a dewdrop absorb exactly one hit", () => {
    const route = testRoute([
      { kind: "dew", s: 20, x: 0 },
      { kind: "rain", s: 60, x: 0, every: 0.1 },
      { kind: "rain", s: 100, x: 0, every: 0.1 },
    ]);
    const { sim, kinds } = run(route);
    expect(kinds.filter((k) => k === "shielded")).toHaveLength(1);
    expect(kinds.filter((k) => k === "hit")).toHaveLength(1);
    expect(sim.glow).toBe(GLOW_START - HIT);
    expect(sim.shield).toBe(false);
  });
});

describe("hazards", () => {
  it("rain hits only while a drop is landing", () => {
    // A drop every 10 s, landing first at 40 s: long after Wick has passed.
    const late = run(testRoute([{ kind: "rain", s: 60, x: 0, every: 10, at: 40 }])).kinds;
    expect(late).not.toContain("hit");
    const often = run(testRoute([{ kind: "rain", s: 60, x: 0, every: 0.1 }])).kinds;
    expect(often).toContain("hit");
  });

  it("a bat hits where it swoops, and can be steered around", () => {
    const route = testRoute([{ kind: "bat", s: 60, x: 0, swing: 0, every: 2 }]);
    expect(run(route).kinds).toContain("hit");
    expect(run(route, () => ({ steer: 0.4, hop: false })).kinds).not.toContain("hit");
  });

  it("a gust pushes sideways, and steering can hold against it", () => {
    const route = testRoute([{ kind: "gust", s: 30, len: 100, push: 6 }]);
    const drifted = run(route, () => IDLE, (s) => s.s > 120).sim;
    expect(drifted.x).toBeGreaterThan(2);
    const held = run(route, (s) => ({ steer: s.x > 0 ? -1 : 0, hop: false }), (s) => s.s > 120).sim;
    expect(Math.abs(held.x)).toBeLessThan(0.5);
  });

  it("never takes glow below zero", () => {
    const route = testRoute(Array.from({ length: 10 }, (_, i) => ({ kind: "rain" as const, s: 20 + i * 15, x: 0, every: 0.1 })));
    expect(run(route).sim.glow).toBe(0);
  });
});

describe("way-lamps", () => {
  it("light in order as Wick passes, wherever Wick is across the ribbon", () => {
    const route = testRoute([
      { kind: "lamp", s: 50 },
      { kind: "lamp", s: 120 },
    ]);
    const { events, sim } = run(route, () => ({ steer: -1, hop: false }));
    expect(events.filter((e) => e.kind === "lamp").map((e) => e.item)).toEqual([0, 1]);
    expect(sim.lamp).toBe(1);
  });
});

describe.each(ROUTES.map((def) => [def.id] as const))("%s never ends a run", (id) => {
  const route = compiled(id);

  it("finishes within three times par under any controls", () => {
    for (let seed = 1; seed <= 50; seed++) {
      const rng = mulberry32(seed);
      let steer = 0;
      const { sim } = run(route, () => {
        if (rng() < 0.05) steer = rng() * 2 - 1;
        return { steer, hop: rng() < 0.02 };
      });
      expect(sim.phase, `seed ${seed}`).toBe("finished");
      expect(raceTicks(sim) * STEP, `seed ${seed}`).toBeLessThan(route.def.par * 3);
      for (const v of [sim.s, sim.x, sim.h, sim.vs, sim.glow]) expect(Number.isFinite(v)).toBe(true);
      expect(sim.glow).toBeGreaterThanOrEqual(0);
    }
  });
});
