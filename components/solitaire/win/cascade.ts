// The classic: Kings first, then Queens and on down, the cards leap off the foundations one after
// another, fall, bounce along the bottom losing height, and run off the side of the screen. The
// canvas is never cleared, so each card leaves the trail Windows 3.1 made famous. Later cards
// launch closer together, so the whole deck is out in about fifteen seconds. The cards still to
// go stay on their foundations.

import { mulberry32 } from "@/lib/random";
import { cardOf, type Suit } from "@/lib/solitaire/cards";
import { STEP, type SimParams, type WinSim } from "./types";

type Flyer = { card: number; x: number; y: number; vx: number; vy: number };

export function cascade(p: SimParams): WinSim {
  const rng = mulberry32(p.seed);
  const g = 1.9 * p.height;
  const floor = p.height - p.cardH / 2;
  const order = Array.from({ length: 52 }, (_, k) => cardOf((k % 4) as Suit, 13 - Math.floor(k / 4)));
  const flyers: Flyer[] = [];
  let next = 0;
  let t = 0;
  let launchAt = 0;
  return {
    clears: false,
    step() {
      t += STEP;
      while (next < order.length && t >= launchAt) {
        const card = order[next];
        const from = p.foundations[Math.floor(card / 13)];
        const dir = rng() < 0.5 ? -1 : 1;
        flyers.push({ card, x: from.x, y: from.y, vx: dir * (0.16 + rng() * 0.3) * p.width, vy: -(0.1 + rng() * 0.55) * p.height });
        next++;
        launchAt += Math.max(0.12, 0.9 - next * 0.05);
      }
      for (const f of flyers) {
        f.vy += g * STEP;
        f.x += f.vx * STEP;
        f.y += f.vy * STEP;
        if (f.y > floor) {
          f.y = floor;
          f.vy = -f.vy * 0.74;
        }
      }
      for (let i = flyers.length - 1; i >= 0; i--) {
        const f = flyers[i];
        if (f.x < -p.cardW / 2 || f.x > p.width + p.cardW / 2) flyers.splice(i, 1);
      }
      if (next >= order.length && flyers.length === 0) return null;
      // The cards still waiting show on their foundations, each pile's next card on top.
      const waiting = [];
      for (let k = next; k < order.length && waiting.length < 4; k++) {
        const card = order[k];
        const home = p.foundations[Math.floor(card / 13)];
        waiting.push({ card, x: home.x, y: home.y, rot: 0 });
      }
      return [...waiting, ...flyers.map((f) => ({ card: f.card, x: f.x, y: f.y, rot: 0 }))];
    },
  };
}
