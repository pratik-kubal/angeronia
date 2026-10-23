// A fountain: the cards erupt from the foundations in a fast stream, spinning, arc high over the
// table and rain down off the bottom of the screen.

import { mulberry32 } from "@/lib/random";
import { STEP, type SimParams, type Sprite, type WinSim } from "./types";

type Drop = { card: number; x: number; y: number; vx: number; vy: number; rot: number; spin: number; at: number };

export function fountain(p: SimParams): WinSim {
  const rng = mulberry32(p.seed);
  const g = 2.2 * p.height;
  const drops: Drop[] = Array.from({ length: 52 }, (_, k) => {
    // Round the four foundations in turn, each pile from the top.
    const card = (k % 4) * 13 + 12 - Math.floor(k / 4);
    const from = p.foundations[k % 4];
    // Enough lift to clear most of the screen's height from where it starts.
    const lift = Math.sqrt(2 * g * Math.max(p.height * 0.35, from.y + p.height * 0.25)) * (0.85 + rng() * 0.3);
    return {
      card,
      x: from.x,
      y: from.y,
      vx: (rng() - 0.5) * 0.9 * p.width,
      vy: -lift,
      rot: 0,
      spin: (rng() < 0.5 ? -1 : 1) * (3 + rng() * 6),
      at: k * 0.055,
    };
  });
  let t = 0;
  return {
    clears: true,
    step() {
      t += STEP;
      const shown: Sprite[] = [];
      const waiting: Sprite[] = [];
      let live = 0;
      for (const d of drops) {
        if (t < d.at) {
          live++;
          waiting.push({ card: d.card, x: d.x, y: d.y, rot: 0 });
          continue;
        }
        d.vy += g * STEP;
        d.x += d.vx * STEP;
        d.y += d.vy * STEP;
        d.rot += d.spin * STEP;
        if (d.y - p.cardH > p.height) continue;
        live++;
        shown.push({ card: d.card, x: d.x, y: d.y, rot: d.rot });
      }
      // The cards still waiting lie under the ones in the air, each pile's next card on top.
      return live ? [...waiting.reverse(), ...shown] : null;
    },
  };
}
