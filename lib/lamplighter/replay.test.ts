import { describe, expect, it } from "vitest";
import { mulberry32 } from "../random";
import { decode, encode, InputLog, pack, replay, unpack } from "./replay";
import { compiled } from "./routes";
import { createSim, hashSim, quantizeSteer, restore, snapshot, step, type Input, type Sim } from "./sim";

const route = compiled("first-light");

function randomInputs(seed: number): () => Input {
  const rng = mulberry32(seed);
  let steer = 0;
  return () => {
    if (rng() < 0.08) steer = rng() * 2 - 1;
    return { steer, hop: rng() < 0.03 };
  };
}

describe("pack", () => {
  it("round-trips every steer step and the hop", () => {
    for (let k = -63; k <= 63; k++) {
      for (const hop of [false, true]) {
        const input = { steer: k / 63, hop };
        expect(unpack(pack(input))).toEqual(input);
      }
    }
  });

  it("stores the steer the simulation sees", () => {
    for (const v of [0.123, -0.777, 1.4, -2]) expect(unpack(pack({ steer: v, hop: false })).steer).toBe(quantizeSteer(v));
  });
});

describe("encode", () => {
  it("round-trips, long runs and all", () => {
    const log = new Uint8Array([...Array(600).fill(63), 64, 64, 191, ...Array(300).fill(10), 0, 255]);
    expect(Array.from(decode(encode(log)))).toEqual(Array.from(log));
    expect(encode(log).length).toBeLessThan(log.length / 10);
  });
});

describe("replay", () => {
  it("gives the same run as playing live", () => {
    for (const seed of [1, 2, 3]) {
      const next = randomInputs(seed);
      const sim = createSim(route);
      const log = new InputLog();
      while (sim.phase !== "finished") {
        const input = next();
        log.push(pack(input));
        step(sim, input, route);
      }
      expect(hashSim(replay(route, log.bytes()))).toBe(hashSim(sim));
    }
  });

  it("still matches after a retry from the last lamp", () => {
    const next = randomInputs(7);
    const sim = createSim(route);
    const log = new InputLog();
    let lamp: Sim | null = null;
    let retried = false;
    while (sim.phase !== "finished") {
      const input = next();
      log.push(pack(input));
      step(sim, input, route);
      if (sim.events.some((e) => e.kind === "lamp")) lamp = snapshot(sim);
      // Some way past the lamp, go back to it once.
      if (!retried && lamp && sim.tick > lamp.tick + 300) {
        restore(sim, lamp);
        log.truncate(lamp.tick);
        retried = true;
      }
    }
    expect(retried).toBe(true);
    expect(log.length).toBe(sim.finishTick);
    expect(hashSim(replay(route, log.bytes()))).toBe(hashSim(sim));
  });
});
