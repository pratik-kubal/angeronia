// A waterfall: the cards fly off the foundations into thirteen columns, Ace to King, one suit to a
// row, then the columns topple off the bottom of the screen one after another like dominoes, each
// card tumbling a moment after the one above it.

import { mulberry32 } from "@/lib/random";
import { cardOf, type Suit } from "@/lib/solitaire/cards";
import { STEP, type SimParams, type Sprite, type WinSim } from "./types";

const FORM = 1.4;
const TOPPLE_AT = 1.8;
const COLUMN_GAP = 0.16;
const ROW_GAP = 0.06;

export function waterfall(p: SimParams): WinSim {
  const rng = mulberry32(p.seed);
  const g = 2.4 * p.height;
  // The grid: 13 columns wide, cards overlapping down each column.
  const scale = Math.min(1, (p.width * 0.92) / (13 * p.cardW * 1.06));
  const colW = p.cardW * 1.06 * scale;
  const x0 = (p.width - 13 * colW) / 2 + colW / 2;
  const step = p.cardH * 0.32;
  const y0 = Math.max(p.cardH / 2 + 8, (p.height - (3 * step + p.cardH)) / 2.6 + p.cardH / 2);
  // Row by row, so each card is drawn over the one above it in its column.
  const cards = Array.from({ length: 52 }, (_, k) => {
    const col = k % 13;
    const row = Math.floor(k / 13);
    const card = cardOf(row as Suit, col + 1);
    return {
      card,
      from: p.foundations[row],
      to: { x: x0 + col * colW, y: y0 + row * step },
      formAt: (col * 4 + row) * 0.02,
      fallAt: TOPPLE_AT + col * COLUMN_GAP + (3 - row) * ROW_GAP,
      vx: (rng() - 0.5) * 0.12 * p.width,
      spin: (rng() - 0.5) * 3,
      vy: 0,
      x: 0,
      y: 0,
      rot: 0,
      falling: false,
    };
  });
  let t = 0;
  return {
    clears: true,
    step() {
      t += STEP;
      const shown: Sprite[] = [];
      let live = 0;
      for (const c of cards) {
        if (t >= c.fallAt) {
          if (!c.falling) {
            c.falling = true;
            c.x = c.to.x;
            c.y = c.to.y;
          }
          c.vy += g * STEP;
          c.x += c.vx * STEP;
          c.y += c.vy * STEP;
          c.rot += c.spin * STEP;
          if (c.y - p.cardH > p.height) continue;
        } else {
          const u = Math.min(1, Math.max(0, (t - c.formAt) / (FORM - 0.5)));
          const e = 1 - (1 - u) ** 3;
          c.x = c.from.x + (c.to.x - c.from.x) * e;
          c.y = c.from.y + (c.to.y - c.from.y) * e;
        }
        live++;
        shown.push({ card: c.card, x: c.x, y: c.y, rot: c.rot });
      }
      return live ? shown : null;
    },
  };
}
