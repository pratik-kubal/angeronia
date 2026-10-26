import { describe, expect, it } from "vitest";
import { COUNTDOWN, TICK_HZ } from "./rules";
import { ALL_FLAMES, FLAME_FINISH, FLAME_GLOW, FLAME_PAR, flameCount, flamesFor, isOpen, totalFlames } from "./scoring";
import { createSim, type Sim } from "./sim";
import { testRoute } from "./test-routes";

const route = testRoute();
const def = { glowGoal: 20, par: 30 };

function finished(glow: number, seconds: number): Sim {
  const sim = createSim(route);
  sim.phase = "finished";
  sim.glow = glow;
  sim.finishTick = COUNTDOWN + seconds * TICK_HZ;
  return sim;
}

describe("flamesFor", () => {
  it("gives nothing for a run that hasn't finished", () => {
    expect(flamesFor(def, createSim(route))).toBe(0);
  });

  it("gives the finish flame, then glow and par as earned", () => {
    expect(flamesFor(def, finished(5, 40))).toBe(FLAME_FINISH);
    expect(flamesFor(def, finished(20, 40))).toBe(FLAME_FINISH | FLAME_GLOW);
    expect(flamesFor(def, finished(5, 30))).toBe(FLAME_FINISH | FLAME_PAR);
    expect(flamesFor(def, finished(25, 29))).toBe(ALL_FLAMES);
  });
});

describe("flames across runs", () => {
  it("add up: a glow flame from one run and a par flame from another make three", () => {
    const kept = flamesFor(def, finished(25, 40)) | flamesFor(def, finished(5, 20));
    expect(kept).toBe(ALL_FLAMES);
    expect(flameCount(kept)).toBe(3);
  });

  it("total over every route, and open a route at its threshold", () => {
    const total = totalFlames({ "first-light": { flames: ALL_FLAMES }, "orchard-lane": { flames: FLAME_FINISH } });
    expect(total).toBe(4);
    expect(isOpen({ unlock: 4 }, total)).toBe(true);
    expect(isOpen({ unlock: 5 }, total)).toBe(false);
  });
});
