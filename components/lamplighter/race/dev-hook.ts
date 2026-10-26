// Development only (the production build drops this file and the bots with it): a handle on the
// running race for the end-to-end specs and for trying routes by hand.
//
//   __lamplighter.state()          Wick's state: tick, phase, s, x, h, glow…
//   __lamplighter.view()           the camera's roll, the pixel ratio, the quality tier, fps
//   __lamplighter.speed(8)         eight simulation ticks per tick: a time-lapse, same physics
//   __lamplighter.autopilot("skilled" | "casual" | null)
//   __lamplighter.lamp()           back to the last way-lamp lit

import type { MutableRefObject } from "react";
import { casualBot, skilledBot } from "@/lib/lamplighter/bot";
import type { RaceController } from "./controller";

export function install(ctl: MutableRefObject<RaceController | null>): () => void {
  const hook = {
    state() {
      const sim = ctl.current?.state();
      if (!sim) return null;
      const { tick, phase, s, x, h, vs, air, dip, off, stuck, shield, glow, sparks, hits, dips, lamp } = sim;
      return { tick, phase, s, x, h, vs, air, dip, off, stuck, shield, glow, sparks, hits, dips, lamp };
    },
    view: () => ctl.current?.view() ?? null,
    speed: (k: number) => ctl.current?.speed(k),
    autopilot: (kind: "skilled" | "casual" | null) => ctl.current?.autopilot(kind === "skilled" ? skilledBot : kind === "casual" ? casualBot(1) : null),
    lamp: () => ctl.current?.retryFromLamp() ?? false,
  };
  const w = window as unknown as { __lamplighter?: typeof hook };
  w.__lamplighter = hook;
  return () => {
    if (w.__lamplighter === hook) delete w.__lamplighter;
  };
}
