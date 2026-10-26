// Every way of steering, merged into one input per tick. Keyboard, touch and tilt each offer a
// steer; the strongest wins. A hop pressed between ticks is latched and used by exactly the next
// tick, so a quick tap is never lost and never counted twice. The steer is quantized here, the
// same way a recording stores it, so what is recorded is exactly what the simulation saw.

import type { Bot } from "@/lib/lamplighter/bot";
import type { Compiled } from "@/lib/lamplighter/compiled";
import { quantizeSteer, type Input, type Sim } from "@/lib/lamplighter/sim";

export interface SteerSource {
  /** Steer −1…1 for this tick; `dt` is the tick's length in seconds. */
  steer(dt: number): number;
}

export type InputHub = {
  sample(sim: Sim, route: Compiled, dt: number): Input;
  /** A hop for the next tick. */
  hop(): void;
  add(source: SteerSource): () => void;
  /** Hands the controls to a bot (the development autopilot), or takes them back. */
  autopilot(bot: Bot | null): void;
  /** Forgets a held hop: after a pause, a restart or a retry. */
  reset(): void;
};

export function createInputHub(): InputHub {
  const sources = new Set<SteerSource>();
  let latched = false;
  let pilot: Bot | null = null;
  return {
    sample(sim, route, dt) {
      if (pilot) {
        latched = false;
        const input = pilot(sim, route);
        return { steer: quantizeSteer(input.steer), hop: input.hop };
      }
      let steer = 0;
      for (const source of sources) {
        const v = source.steer(dt);
        if (Math.abs(v) > Math.abs(steer)) steer = v;
      }
      const hop = latched;
      latched = false;
      return { steer: quantizeSteer(steer), hop };
    },
    hop() {
      latched = true;
    },
    add(source) {
      sources.add(source);
      return () => sources.delete(source);
    },
    autopilot(bot) {
      pilot = bot;
    },
    reset() {
      latched = false;
    },
  };
}
