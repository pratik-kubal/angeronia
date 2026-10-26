import { describe, expect, it } from "vitest";
import { casualBot, idleBot, skilledBot, type Bot } from "./bot";
import type { Compiled } from "./compiled";
import { ROUTES, compiled } from "./routes";
import { STEP } from "./rules";
import { ALL_FLAMES, FLAME_FINISH, FLAME_GLOW, flameCount, flamesFor, isOpen } from "./scoring";
import { createSim, raceTicks, step } from "./sim";

// Every route is fair: par is set from the skilled bot and stays honest, the glow goal is within a
// good player's reach, and a casual player (late, wobbly, missing hops) still gets to the lantern.

function race(route: Compiled, bot: Bot) {
  const sim = createSim(route);
  for (let guard = 0; guard < 60 * 60 * 10 && sim.phase !== "finished"; guard++) step(sim, bot(sim, route), route);
  return { sim, seconds: raceTicks(sim) * STEP, flames: flamesFor(route.def, sim) };
}

describe.each(ROUTES.map((def) => [def.id] as const))("%s", (id) => {
  const route = compiled(id);
  const { def } = route;
  const skilled = race(route, skilledBot);

  it("gives a skilled run all three flames, with par neither lax nor out of reach", () => {
    expect(skilled.sim.phase).toBe("finished");
    const ratio = skilled.seconds / def.par;
    expect(ratio, `skilled ${skilled.seconds.toFixed(2)} s against par ${def.par} s`).toBeGreaterThanOrEqual(0.8);
    expect(ratio, `skilled ${skilled.seconds.toFixed(2)} s against par ${def.par} s`).toBeLessThanOrEqual(0.95);
    expect(skilled.sim.glow).toBeGreaterThanOrEqual(def.glowGoal);
    expect(skilled.flames).toBe(ALL_FLAMES);
  });

  it("asks for a glow between half the most there is and what a skilled run gathers", () => {
    expect(def.glowGoal, `most ${route.maxGlow}, skilled ${skilled.sim.glow}`).toBeGreaterThanOrEqual(route.maxGlow * 0.5);
    expect(def.glowGoal, `most ${route.maxGlow}, skilled ${skilled.sim.glow}`).toBeLessThanOrEqual(skilled.sim.glow * 0.85);
  });

  it("brings a casual player to the lantern, with its glow flame, inside twice par", () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const casual = race(route, casualBot(seed));
      expect(casual.sim.phase, `seed ${seed}`).toBe("finished");
      expect(casual.seconds, `seed ${seed}`).toBeLessThan(def.par * 2);
      expect(casual.flames & (FLAME_FINISH | FLAME_GLOW), `seed ${seed}: glow ${casual.sim.glow}`).toBe(FLAME_FINISH | FLAME_GLOW);
    }
  });

  it("brings even untouched controls to the lantern inside three times par", () => {
    const idle = race(route, idleBot);
    expect(idle.sim.phase).toBe("finished");
    expect(idle.seconds).toBeLessThan(def.par * 3);
  });
});

describe("unlocks", () => {
  it("open the routes in order", () => {
    expect(ROUTES[0].unlock).toBe(0);
    for (let i = 1; i < ROUTES.length; i++) expect(ROUTES[i].unlock).toBeGreaterThan(ROUTES[i - 1].unlock);
  });

  it("never need a par flame: finish and glow on every route open the next", () => {
    let total = 0;
    for (const def of ROUTES) {
      expect(isOpen(def, total), def.id).toBe(true);
      total += flameCount(FLAME_FINISH | FLAME_GLOW);
    }
  });
});
