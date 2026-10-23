// A whirl: the cards rise off the foundations into a ring round the middle of the table, the ring
// spins faster and faster, then flings itself wider until every card has spun off the screen.

import { mulberry32 } from "@/lib/random";
import { STEP, type SimParams, type Sprite, type WinSim } from "./types";

const GATHER = 1.2;
const SPIN = 2.6;

export function spiral(p: SimParams): WinSim {
  const rng = mulberry32(p.seed);
  const cx = p.width / 2;
  const cy = p.height / 2;
  const r0 = 0.3 * Math.min(p.width, p.height);
  const escape = Math.hypot(p.width, p.height) / 2 + Math.max(p.cardW, p.cardH);
  const cards = Array.from({ length: 52 }, (_, k) => ({
    card: (k % 4) * 13 + Math.floor(k / 4),
    from: p.foundations[k % 4],
    angle: (2 * Math.PI * k) / 52,
    delay: rng() * 0.35,
  }));
  let t = 0;
  let theta = 0;
  let omega = 0.8;
  let r = r0;
  return {
    clears: true,
    step() {
      t += STEP;
      if (t > GATHER) {
        omega = Math.min(7, omega + 2.2 * STEP);
        theta += omega * STEP;
      }
      if (t > GATHER + SPIN) r *= 1 + 1.6 * STEP;
      if (r > escape) return null;
      return cards.map((c) => {
        const a = c.angle + theta;
        const ringX = cx + Math.cos(a) * r;
        const ringY = cy + Math.sin(a) * r;
        const u = Math.min(1, Math.max(0, (t - c.delay) / (GATHER - 0.35)));
        const e = 1 - (1 - u) ** 3;
        return {
          card: c.card,
          x: c.from.x + (ringX - c.from.x) * e,
          y: c.from.y + (ringY - c.from.y) * e,
          rot: (a + Math.PI / 2) * e,
        };
      });
    },
  };
}
