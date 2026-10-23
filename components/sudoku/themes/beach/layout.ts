"use client";

import { useMemo } from "react";
import { mulberry32 } from "@/lib/random";
import { useAnchor, type Anchor } from "../use-anchor";

// Where the cove's pieces sit, from the game's measured boxes (px from the shell's top-left).
// Three modes: "compact" (a phone held upright, an iPad in portrait): the sea is the band between
// the header and the board, whose top edge is the shore; the castle stands on that edge under the
// title (on an iPad, big in the tall gap under the board), the crab in the gap under the board.
// "side" (a phone on its side): the sea runs under the header and the castle fills the free band
// between the header and the pad. "wide" (a desktop): a panorama on both sides of the game, the
// castle big in the left panel; the panels end at the column's outer edges, the pad's and the
// dock's where a short window shrinks the board under them, and a window with too little room for
// the castle beside the column is "compact". Nothing is ever drawn where the board, a round button,
// the title, a key, the clock or the dock sit; the pad's top row leaves half a key free at each end,
// where a starfish or the crab may sit when the gaps are too thin for them.

export type Anchors = { shell: Anchor; bar: Anchor; title: Anchor; board: Anchor; rule: Anchor; pad: Anchor; dock: Anchor };
export type Mode = "compact" | "side" | "wide";
/** A centre and a size in px. */
export type Spot = { x: number; y: number; s: number };
export type Rect = { x: number; y: number; w: number; h: number };

export type BeachLayout = {
  mode: Mode;
  W: number;
  H: number;
  /** Where the sky meets the sea, and the sea the sand. */
  horizon: number;
  shore: number;
  /** The sun (the moon at night): its x and radius, and its y with the board empty (`low`, half set) and full (`high`). */
  sun: { x: number; r: number; low: number; high: number };
  /** The castle's box (3:2), or null where there's no room. */
  castle: Rect | null;
  crab: Spot | null;
  /** Where the fry lies that the gull steals, and the swooping gull's size. */
  fry: Spot;
  thief: number;
  /** Where the season's tide reaches as it comes in: its left edge and its top (the crest rides above it). */
  tide: { x: number; y: number };
  /** The board's box, for the corner flags of Four Towers. */
  board: Rect;
  /** The title's emblem, where the seven seas ripple out from. */
  emblem: { x: number; y: number };
  /** Where each of the seven sea creatures leaps from, and how high. */
  seas: Spot[];
  leap: number;
  stars: (Spot & { group: number })[];
  clouds: Spot[];
  /** The distant gulls gliding by (day): their height, size and travel. */
  gulls: (Spot & { delay: number })[];
  shooting: Spot;
  shells: Spot[];
  starfish: Spot[];
  /** The wide panorama's props, scaled by k; the iPad's gutter bucket. */
  props: {
    k: number;
    lighthouse: Spot | null;
    boat: Spot | null;
    umbrella: Spot | null;
    bucket: Spot | null;
    glitter: boolean;
  };
};

export const clamp = (lo: number, v: number, hi: number) => Math.max(lo, Math.min(hi, v));
const inside = (x: number, y: number, r: Rect, pad = 0) => x > r.x - pad && x < r.x + r.w + pad && y > r.y - pad && y < r.y + r.h + pad;
const rect = (a: Anchor): Rect => ({ x: a.x, y: a.y, w: a.width, h: a.height });
/** The castle with room for its flag above. */
const flagged = (r: Rect): Rect => ({ x: r.x, y: r.y - 16, w: r.w, h: r.h + 16 });

export function beachLayout({ shell, bar, title, board, rule, pad, dock }: Anchors): BeachLayout {
  const W = shell.width;
  const H = shell.height;
  const barBottom = bar.y + bar.height;
  const boardRight = board.x + board.width;
  const boardBottom = board.y + board.height;
  const padBottom = pad.y + pad.height;
  // The round buttons' inner edges (the gear's right, the home link's left), and the title's (it is as wide as its words).
  const gear = bar.x + 44;
  const home = bar.x + bar.width - 44;
  const titleRight = title.x + title.width;
  const titleBottom = title.y + title.height;
  // The column's outer edges (upright): the board's, or the pad's and the dock's where they are wider.
  const colLeft = Math.min(board.x, pad.x, dock.x);
  const colRight = Math.max(boardRight, pad.x + pad.width, dock.x + dock.width);
  // The side layout first: a short, wide window centres the board too, but its controls stand beside it.
  const mode: Mode = bar.x > boardRight ? "side" : colLeft >= 220 ? "wide" : "compact";
  const emblem = { x: title.x + 8, y: title.y + title.height / 2 };

  let horizon: number;
  let shore: number;
  let castle: Rect | null = null;
  let crab: Spot | null = null;
  let sun: BeachLayout["sun"];
  let seas: Spot[];
  let leap: number;
  const clouds: Spot[] = [];
  const gulls: BeachLayout["gulls"] = [];
  const shells: Spot[] = [];
  const starfish: Spot[] = [];
  let shooting: Spot;
  let fry: Spot;
  let thief = 54;
  // The tide stops short of the board: its crest, and the crab riding it, stay in the gap under it.
  let tide = { x: 0, y: Math.max(H * 0.66, boardBottom + 36) };
  const props: BeachLayout["props"] = { k: 1, lighthouse: null, boat: null, umbrella: null, bucket: null, glitter: false };

  /**
   * The sun in the header, between the title and the home link, as big as the room there allows;
   * where there's none (a long title on a narrow phone) it stays half set on the sea below them.
   */
  const barSun = (low: number, most: number): BeachLayout["sun"] => {
    const room = home - titleRight;
    const r = clamp(8, (room - 6) / 3.2, most);
    const high = room >= r * 3.2 + 6 ? bar.y + 4 + r : Math.min(low, titleBottom + r * 1.6);
    return { x: (titleRight + home) / 2, r, low, high };
  };
  // The pad's top row (1 to 5) leaves half a key free at each end: a spot there, left or right.
  const col = pad.width / 12;
  const keyH = (pad.height - (mode === "side" ? 6 : 8)) / 2;
  const corner = (end: 0 | 1, most: number): Spot => ({
    x: end ? pad.x + pad.width - col / 2 : pad.x + col / 2,
    y: pad.y + keyH / 2,
    s: Math.min(most, col - 6, keyH - 8),
  });

  if (mode === "wide") {
    horizon = Math.round(H * 0.3);
    shore = Math.round(H * 0.47);
    // The panels' widths, left and right of the column.
    const panel = colLeft;
    const rw = W - colRight;
    const k = clamp(0.6, panel / 380, 1.2);
    props.k = k;
    const w = clamp(160, panel * 0.62, 260);
    castle = { x: panel / 2 - w / 2, y: shore + (H - shore) * 0.55 - w / 1.5, w, h: w / 1.5 };
    // The crab right of the castle and the bucket left of it, both inside the panel however narrow it is.
    crab = { x: Math.min(castle.x + castle.w + 30 * k, panel - 27 * k), y: castle.y + castle.h - 8 * k, s: 46 * k };
    const r = 30 * k;
    sun = { x: colRight + rw * 0.55, r, low: horizon, high: Math.max(r + 24, horizon * 0.36) };
    // Four in the left panel's sea (clear of the lighthouse), three in the right's (clear of the boat).
    seas = [0, 1, 2, 3].map((i) => ({ x: panel * (0.32 + i * 0.17), y: horizon + (shore - horizon) * 0.5, s: 30 * k }));
    seas.push(...[0, 1, 2].map((i) => ({ x: colRight + rw * (0.14 + i * 0.2), y: horizon + (shore - horizon) * 0.5, s: 30 * k })));
    leap = 46 * k;
    clouds.push({ x: panel * 0.16, y: horizon * 0.3, s: 120 * k }, { x: colRight + rw * 0.26, y: horizon * 0.6, s: 90 * k }, { x: panel * 0.6, y: horizon * 0.14, s: 70 * k });
    gulls.push({ x: 0, y: horizon * 0.62, s: 22 * k, delay: 0 }, { x: 0, y: horizon * 0.24, s: 17 * k, delay: -23 });
    shooting = { x: panel * 0.22, y: horizon * 0.2, s: 130 * k };
    props.lighthouse = { x: panel * 0.18, y: horizon + 28 * k, s: k };
    props.boat = { x: colRight + rw * 0.74, y: horizon + (shore - horizon) * 0.36, s: k };
    props.umbrella = { x: colRight + rw * 0.5, y: shore + (H - shore) * 0.6, s: k };
    props.bucket = { x: Math.max(castle.x - 34 * k, 28 * k), y: castle.y + castle.h - 26 * k, s: k };
    props.glitter = true;
    // The fry lies on the towel, under the umbrella.
    fry = { x: props.umbrella.x - 34 * k, y: props.umbrella.y + 26 * k, s: 24 * k };
    thief = 64 * k;
    const rng = mulberry32(0xbeac4 + 7);
    const sandY = (f: number) => shore + 30 + (H - shore - 60) * f;
    shells.push({ x: panel * (0.2 + rng() * 0.15), y: sandY(0.9), s: 20 * k }, { x: colRight + rw * (0.12 + rng() * 0.1), y: sandY(0.92), s: 22 * k });
    starfish.push({ x: panel * 0.12, y: sandY(0.62 + rng() * 0.1), s: 28 * k }, { x: colRight + rw * 0.86, y: sandY(0.2 + rng() * 0.1), s: 24 * k });
  } else if (mode === "side") {
    shore = pad.y - 22;
    // The sea at most 90px deep: a taller free band leaves the sky its top, for the sun to climb in.
    horizon = Math.max(barBottom + 4, shore - 90);
    const sky = horizon - barBottom;
    const base = pad.y - 6;
    const h = Math.min(base - (barBottom + 6), 72);
    if (h >= 32) castle = { x: bar.x + bar.width / 2 - h * 0.75, y: base - h, w: h * 1.5, h };
    crab = castle ? { x: castle.x + castle.w + 22, y: base - 8, s: 24 } : { x: bar.x + bar.width - 30, y: base - 8, s: 24 };
    sun = sky >= 48 ? { x: bar.x + bar.width * 0.84, r: 14, low: horizon, high: barBottom + 22 } : barSun(horizon, 14);
    seas = Array.from({ length: 7 }, (_, i) => ({ x: bar.x + 16 + ((bar.width - 32) * (i + 0.5)) / 7, y: horizon + 16, s: 20 }));
    leap = clamp(10, horizon + 4 - barBottom, 30);
    if (board.x >= 60) clouds.push({ x: board.x / 2, y: 26, s: Math.min(50, board.x - 12) });
    if (sky >= 40) clouds.push({ x: bar.x + bar.width * 0.3, y: barBottom + sky * 0.45, s: 50 });
    gulls.push({ x: 0, y: sky >= 24 ? barBottom + 6 : Math.max(0, bar.y - 6), s: 14, delay: 0 });
    shooting = sky >= 40 ? { x: bar.x + 10, y: barBottom + 12, s: 50 } : { x: (boardRight + bar.x) / 2 - 20, y: 18, s: 50 };
    fry = castle ? { x: castle.x - 12, y: base - 6, s: 16 } : { x: bar.x + 30, y: base - 6, s: 16 };
    starfish.push(board.x >= 40 ? { x: board.x / 2, y: H - 30, s: Math.min(22, board.x - 16) } : corner(0, 18));
    // Up the right-hand column only (from the middle of the gap beside the board), over the pad and the dock.
    tide = { x: (boardRight + bar.x) / 2, y: pad.y - 4 };
  } else {
    // The sea is the band between the header and the board, at least 16px deep (behind the round
    // buttons' feet where the band is shallower); the board's top edge is the shore.
    shore = board.y;
    horizon = Math.min(barBottom + Math.min(8, (board.y - barBottom) * 0.3), shore - 16);
    sun = barSun(horizon, 13);
    const gapB = rule.y - boardBottom;
    const gapC = dock.y - padBottom;
    const right = W - boardRight;
    // A tablet held upright has a tall empty band under the board: the castle stands there, big,
    // with the crab beside it. Otherwise it stands on the board's top edge under the title, as tall
    // as the room under the title allows (its top, the flag's tip, may reach the title's line box
    // under the baseline: the words never come down that far in the middle).
    const roomy = gapB >= 100;
    if (roomy) {
      const h = Math.min(gapB - 24, 140);
      castle = { x: board.x + board.width / 2 - h * 0.75, y: boardBottom + (gapB - h) / 2 + 8, w: h * 1.5, h };
      crab = { x: castle.x + castle.w + 30, y: castle.y + castle.h - 14, s: 34 };
    } else {
      const w = Math.min(clamp(20, board.y - titleBottom + 2, 66) * 1.5, board.width * 0.42);
      castle = { x: board.x + board.width / 2 - w / 2, y: board.y - w / 1.5, w, h: w / 1.5 };
      if (gapB >= 22) crab = { x: boardRight - 22, y: boardBottom + gapB / 2 + 1, s: Math.min(26, gapB - 2) };
      else if (right >= 32) crab = { x: boardRight + right / 2, y: boardBottom - 18, s: Math.min(26, right - 10) };
      else if (gapC >= 18) crab = { x: pad.x + pad.width - 36, y: padBottom + gapC / 2, s: Math.min(22, gapC - 2) };
      else crab = corner(1, 24);
    }
    // The seven seas leap out of the open water between the round buttons, peaking under the title
    // (a toast announcing the find covers the middle of the header).
    const span = home - gear - 20;
    const from = Math.min(horizon + 16, shore - 2);
    seas = Array.from({ length: 7 }, (_, i) => ({ x: gear + 10 + (span * (i + 0.5)) / 7, y: from, s: 18 }));
    leap = clamp(10, from - 9 - (titleBottom + 2), 20);
    // Left of the title: a cloud (where it can drift without touching the gear or the title), and
    // the fry at the water's edge, so the thief's dive bottoms out between them.
    const left = title.x - gear;
    if (left >= 56) clouds.push({ x: (gear + title.x) / 2, y: bar.y + 20, s: Math.min(44, left - 32) });
    thief = clamp(40, left - 8, 54);
    fry = { x: gear + Math.max(6, (left - thief) / 2) + thief * 0.03, y: board.y - 11, s: 16 };
    gulls.push({ x: 0, y: bar.y - 5, s: 14, delay: 0 });
    // Off the gear's shoulder, towards the title.
    shooting = { x: gear - 52, y: bar.y + 2, s: 54 };
    if (gapB >= 18) shells.push({ x: board.x + 30, y: boardBottom + gapB / 2 + 2, s: 13 });
    else if (board.x >= 32) shells.push({ x: board.x / 2, y: boardBottom - 24, s: 14 });
    starfish.push(gapC >= 20 ? { x: pad.x + 22, y: padBottom + gapC / 2, s: Math.min(16, gapC - 8) } : corner(0, 18));
    // An iPad in portrait: room in the gutters for a cloud, a bucket and a starfish.
    if (board.x >= 64) {
      clouds.push({ x: board.x / 2, y: bar.y + 22, s: Math.min(80, board.x - 40) });
      props.bucket = { x: board.x / 2, y: boardBottom - 30, s: clamp(0.6, board.x / 110, 1) };
      starfish.push({ x: boardRight + right / 2, y: boardBottom - 60, s: Math.min(26, right / 3) });
    }
  }

  // Stars (night): seeded, clear of the round buttons, the title, the board, the pad, the dock and the moon's path.
  const avoid: Rect[] = [
    { x: bar.x, y: bar.y, w: 48, h: bar.height },
    { x: bar.x + bar.width - 48, y: bar.y, w: 48, h: bar.height },
    rect(title),
    rect(board),
    rect(pad),
    rect(dock),
  ];
  const moon: Rect = { x: sun.x - sun.r * 2.5, y: sun.high - sun.r * 2.5, w: sun.r * 5, h: sun.low - sun.high + sun.r * 5 };
  const rng = mulberry32(0xbeac4);
  const stars: BeachLayout["stars"] = [];
  const count = mode === "wide" ? 16 : 8;
  for (let tries = 0; stars.length < count && tries < 400; tries++) {
    const x = 4 + rng() * (W - 8);
    const y = 4 + rng() * (horizon - 12);
    const s = 2 + rng() * 2.5;
    if (avoid.some((a) => inside(x, y, a, 4)) || inside(x, y, moon) || (castle && inside(x, y, flagged(castle), 6))) continue;
    stars.push({ x, y, s, group: stars.length % 3 });
  }

  return { mode, W, H, horizon, shore, sun, castle, crab, fry, thief, tide, board: rect(board), emblem, seas, leap, stars, clouds, gulls, shooting, shells, starfish, props };
}

/** The cove's layout, once every piece of the game is measured (null until then). */
export function useBeachLayout(): BeachLayout | null {
  const shell = useAnchor(".sdk-shell");
  const bar = useAnchor(".sdk-bar");
  const title = useAnchor(".sdk-title");
  const board = useAnchor(".sdk-board");
  const rule = useAnchor(".sdk-rule");
  const pad = useAnchor(".sdk-pad");
  const dock = useAnchor(".sdk-dock");
  return useMemo(
    () => (shell && bar && title && board && rule && pad && dock ? beachLayout({ shell, bar, title, board, rule, pad, dock }) : null),
    [shell, bar, title, board, rule, pad, dock],
  );
}
