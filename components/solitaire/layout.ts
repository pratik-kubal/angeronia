// Where everything sits on the table, from the table's measured size: pure, so the card positions
// the animator flies to are the ones layout.test.ts checks at real screen sizes.
//
// Two arrangements. Classic is Windows': stock, waste and the four foundations in a row over the
// seven columns, the controls in a bar below (portrait phones, iPads, desktops). Rails is for a
// phone on its side, where the table is short and wide: the stock and the waste (fanned down) in
// a left rail, the foundations two by two in a right rail, the controls under them, and the
// columns between with the whole height. Rails is used only where classic's cards would be too
// small to read and rails' are clearly bigger.

import { CARDS, type Card } from "@/lib/solitaire/cards";
import type { Table } from "@/lib/solitaire/deal";
import { FOUNDATION_IDS, PILE_IDS, TABLEAU_IDS, type PileId } from "@/lib/solitaire/game";

export type Arrangement = "classic" | "rails";
export type Rect = { x: number; y: number; w: number; h: number };
export type Place = { x: number; y: number; z: number; up: boolean };
export type Layout = {
  arrangement: Arrangement;
  cardW: number;
  cardH: number;
  /** Small cards draw their own big corner index over the art's (too small to read). */
  bigIndex: boolean;
  /** Each pile's base, where its bottom card lies. */
  slots: Record<PileId, Rect>;
  /** Where a dragged card can be dropped on each pile (empty for the stock and the waste). */
  drops: Record<PileId, Rect>;
  /** Every card's place, by card id. */
  cards: Place[];
  /** The controls: one bar (classic), or a group under each rail (rails). */
  controls: Rect[];
};

/** The art's proportions (viewBox 167.09 × 242.67). */
export const CARD_ASPECT = 242.667 / 167.087;
export const MAX_CARD_W = 150;
export const MIN_CARD_W = 24;
/** Below this width the art's corner index is too small to read. */
export const BIG_INDEX_BELOW = 72;

/** Steps down a column, as fractions of the card's height. */
const DOWN_STEP = 0.07;
const UP_STEP = 0.3;
const UP_MIN = 0.16;
const UP_MIN_PX = 13;
const upMin = (h: number) => Math.max(UP_MIN * h, UP_MIN_PX);
/** The longest column there can be: six face down under thirteen face up. */
const WORST = { down: 6, up: 13 };
const worstColumn = (h: number) => h + WORST.down * DOWN_STEP * h + (WORST.up - 1) * upMin(h);

const MARGIN = 10;
const barHeight = (H: number) => (H < 700 ? 48 : 56);
/** Rails: the controls under the waste fan (Undo, Hint) and under the foundations (score, Menu). */
const RAIL_CONTROLS_LEFT = 44;
const RAIL_CONTROLS_RIGHT = 84;

/** Classic: columns' gap, side margin and the gap under the top row, by card width. */
function classicMetrics(w: number, W: number, H: number) {
  const h = w * CARD_ASPECT;
  const gapMin = (W < 600 ? 0.07 : 0.12) * w;
  const gap = Math.min(0.35 * w, Math.max(gapMin, (W - 2 * MARGIN - 7 * w) / 6));
  const rowGap = (W < H ? 0.14 : 0.18) * h;
  return { h, gapMin, gap, rowGap };
}

function classicFits(w: number, W: number, H: number): boolean {
  const { h, gapMin, rowGap } = classicMetrics(w, W, H);
  const width = 7 * w + 6 * gapMin + 2 * MARGIN;
  const height = MARGIN + h + rowGap + worstColumn(h) + 6 + barHeight(H);
  return width <= W && height <= H;
}

function railsMetrics(w: number) {
  const h = w * CARD_ASPECT;
  return { h, gap: 0.1 * w, pad: 0.12 * w, fanStep: 0.2 * h };
}

function railsFits(w: number, W: number, H: number): boolean {
  const { h, gap, pad, fanStep } = railsMetrics(w);
  const width = w + 2 * pad + (7 * w + 6 * gap) + (2 * w + gap + 2 * pad);
  const left = h + gap + h + 2 * fanStep + gap + RAIL_CONTROLS_LEFT;
  const right = 2 * h + gap + gap + RAIL_CONTROLS_RIGHT;
  const column = worstColumn(h);
  return width + 2 * MARGIN <= W && Math.max(left, right, column) + 2 * MARGIN <= H;
}

/** The widest card (to half a pixel) an arrangement fits, or 0 when even the smallest doesn't. */
function widest(fits: (w: number) => boolean): number {
  if (!fits(MIN_CARD_W)) return 0;
  let lo = MIN_CARD_W;
  let hi = MAX_CARD_W;
  if (fits(hi)) return hi;
  while (hi - lo > 0.5) {
    const mid = (lo + hi) / 2;
    if (fits(mid)) lo = mid;
    else hi = mid;
  }
  return Math.floor(lo * 2) / 2;
}

/** Classic unless its cards would be too small to read and rails' are at least 10% bigger. */
export function chooseArrangement(W: number, H: number): { arrangement: Arrangement; cardW: number } {
  const classic = widest((w) => classicFits(w, W, H));
  const rails = widest((w) => railsFits(w, W, H));
  if (classic < BIG_INDEX_BELOW && rails >= classic * 1.1) return { arrangement: "rails", cardW: rails };
  return { arrangement: "classic", cardW: Math.max(classic, MIN_CARD_W) };
}

const rect = (x: number, y: number, w: number, h: number): Rect => ({ x, y, w, h });

/** Lays the table out in a W × H box (CSS px), positions rounded to device pixels. */
export function computeLayout(size: { w: number; h: number }, table: Table, dpr = 1): Layout {
  const W = size.w;
  const H = size.h;
  const { arrangement, cardW: w } = chooseArrangement(W, H);
  const h = w * CARD_ASPECT;
  const px = (v: number) => Math.round(v * dpr) / dpr;

  const slots = {} as Record<PileId, Rect>;
  let colX: number[];
  let colTop: number;
  let colBottom: number;
  let colGap: number;
  let fan: { dx: number; dy: number };
  const controls: Rect[] = [];

  if (arrangement === "classic") {
    const { gap, rowGap } = classicMetrics(w, W, H);
    colGap = gap;
    const x0 = (W - (7 * w + 6 * gap)) / 2;
    colX = TABLEAU_IDS.map((_, i) => x0 + i * (w + gap));
    slots.s = rect(colX[0], MARGIN, w, h);
    slots.w = rect(colX[1], MARGIN, w, h);
    FOUNDATION_IDS.forEach((f, i) => (slots[f] = rect(colX[3 + i], MARGIN, w, h)));
    colTop = MARGIN + h + rowGap;
    const bar = barHeight(H);
    colBottom = H - bar - 6;
    controls.push(rect(0, H - bar, W, bar));
    fan = { dx: 0.24 * w, dy: 0 };
  } else {
    const { gap, pad, fanStep } = railsMetrics(w);
    colGap = gap;
    const content = w + 2 * pad + (7 * w + 6 * gap) + (2 * w + gap + 2 * pad);
    const spare = (W - 2 * MARGIN - content) / 4;
    const left = MARGIN + spare + pad;
    const x0 = left + w + pad + spare;
    colX = TABLEAU_IDS.map((_, i) => x0 + i * (w + gap));
    const right = x0 + 7 * w + 6 * gap + spare + pad;
    slots.s = rect(left, MARGIN, w, h);
    slots.w = rect(left, MARGIN + h + gap, w, h);
    FOUNDATION_IDS.forEach((f, i) => (slots[f] = rect(right + (i % 2) * (w + gap), MARGIN + Math.floor(i / 2) * (h + gap), w, h)));
    colTop = MARGIN;
    colBottom = H - MARGIN;
    const leftTop = MARGIN + 2 * h + gap + 2 * fanStep + gap;
    controls.push(rect(left - pad, leftTop, w + 2 * pad, H - MARGIN - leftTop));
    const rightTop = MARGIN + 2 * h + 2 * gap;
    controls.push(rect(right - pad, rightTop, 2 * w + gap + 2 * pad, H - MARGIN - rightTop));
    fan = { dx: 0, dy: fanStep };
  }
  TABLEAU_IDS.forEach((t, i) => (slots[t] = rect(colX[i], colTop, w, h)));

  const cards: Place[] = Array(CARDS.length);
  const place = (card: Card, x: number, y: number, z: number, up: boolean) => (cards[card] = { x: px(x), y: px(y), z, up });

  // The stock: a deck seen from above, every eight cards one step thicker toward the light.
  table.stock.forEach((card, k) => {
    const lift = Math.min(2, Math.floor(k / 8)) * 1.5;
    place(card, slots.s.x - lift, slots.s.y - lift, k, false);
  });
  // The waste: the latest draw's cards still on top are fanned (always at least the top one).
  const n = table.waste.length;
  const fanned = n ? Math.max(1, Math.min(table.fan, n)) : 0;
  table.waste.forEach((card, k) => {
    const j = Math.max(0, k - (n - fanned));
    place(card, slots.w.x + j * fan.dx, slots.w.y + j * fan.dy, 100 + k, true);
  });
  table.foundations.forEach((pile, f) => pile.forEach((card, k) => place(card, slots[FOUNDATION_IDS[f]].x, slots[FOUNDATION_IDS[f]].y, 200 + k, true)));

  // The columns: face-down cards close together, the face-up run spread as far as the room allows.
  const drops = {} as Record<PileId, Rect>;
  table.tableau.forEach((col, i) => {
    const nd = col.down.length;
    const nu = col.up.length;
    const room = colBottom - colTop;
    let down = DOWN_STEP * h;
    let up = nu > 1 ? Math.min(UP_STEP * h, Math.max(upMin(h), (room - h - nd * down) / (nu - 1))) : UP_STEP * h;
    const length = () => h + nd * down + Math.max(0, nu - 1) * up;
    if (length() > room) down = Math.max(0.03 * h, (room - h - Math.max(0, nu - 1) * up) / Math.max(1, nd));
    if (length() > room && nu > 1) up = Math.max(4, (room - h - nd * down) / (nu - 1));
    const x = colX[i];
    col.down.forEach((card, k) => place(card, x, colTop + k * down, 300 + i * 20 + k, false));
    col.up.forEach((card, k) => place(card, x, colTop + nd * down + k * up, 300 + i * 20 + nd + k, true));
    const bottom = Math.min(colBottom, colTop + length() + 0.5 * h);
    drops[TABLEAU_IDS[i]] = rect(x - colGap / 2, colTop, w + colGap, bottom - colTop);
  });
  const grow = 0.12 * w;
  FOUNDATION_IDS.forEach((f) => (drops[f] = rect(slots[f].x - grow, slots[f].y - grow, w + 2 * grow, h + 2 * grow)));
  drops.s = rect(0, 0, 0, 0);
  drops.w = rect(0, 0, 0, 0);

  for (const id of PILE_IDS) {
    const r = slots[id];
    slots[id] = rect(px(r.x), px(r.y), px(r.w), px(r.h));
  }
  const cardW = px(w);
  return { arrangement, cardW, cardH: px(h), bigIndex: cardW < BIG_INDEX_BELOW, slots, drops, cards, controls };
}

const overlap = (a: Rect, b: Rect) =>
  Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));

/**
 * The pile a dragged card (its rect) drops on: of the `legal` piles, the one whose drop zone it
 * overlaps most (the nearer centre on a tie). Every foundation's zone counts for the card's own
 * foundation (`own`), so a card dropped on any foundation goes up on its suit's.
 */
export function dropTarget(layout: Layout, card: Rect, legal: readonly PileId[], own?: PileId): PileId | null {
  const cx = card.x + card.w / 2;
  const cy = card.y + card.h / 2;
  let best: PileId | null = null;
  let bestArea = 0;
  let bestDist = Infinity;
  for (const id of legal) {
    const zones = id === own ? FOUNDATION_IDS.map((f) => layout.drops[f]) : [layout.drops[id]];
    const area = Math.max(...zones.map((z) => overlap(z, card)));
    if (area <= 0) continue;
    const z = layout.drops[id];
    const dist = Math.hypot(z.x + z.w / 2 - cx, z.y + z.h / 2 - cy);
    if (area > bestArea || (area === bestArea && dist < bestDist)) {
      best = id;
      bestArea = area;
      bestDist = dist;
    }
  }
  return best;
}
