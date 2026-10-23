// Where the Halloween scene sits, worked out from the game's measured pieces (useAnchor), so it
// never covers a cell or a control: the moon in the top sky, the nine pumpkins of the sill standing
// on the divider under the board (or beside it where the gap under it is too thin, or at the foot of
// the free band over the pad of a phone on its side with no margin), bats on tracks through the empty
// bands, and on a wide screen a whole hill on each side. Pure: no React, no DOM.

import type { Anchor } from "../use-anchor";

export type Pieces = {
  shell: Anchor;
  game: Anchor;
  bar: Anchor;
  title: Anchor;
  gapA: Anchor;
  board: Anchor;
  gapB: Anchor;
  pad: Anchor;
};

/** A phone held upright (or a tablet), a phone on its side, or a screen with room on both sides. */
export type Mode = "tall" | "side" | "wide";
export type Point = { x: number; y: number };
/** A pumpkin: its foot's centre (x, y), its width, its tilt and the 3×3 box it stands for. */
export type Pumpkin = { x: number; y: number; size: number; tilt: number; box: number };
/** A bat's flight: across from x `from` to x `to` at height `y`, resting at x `rest` when nothing moves. */
export type Flight = { y: number; from: number; to: number; rest: number; size: number; seconds: number; delay: number };

export type Scenery = {
  scale: number;
  /** The two ridges along the bottom, as SVG paths over the whole shell. */
  far: string;
  near: string;
  /** The cottage's foot (its left edge and the ground), the tree's foot (right edge) and the resident ghost. */
  cottage: Point;
  tree: Point;
  ghost: Point;
  /** Plain pumpkins on the near ridge, carved and lit only when the board is solved. */
  patch: Pumpkin[];
  /** Day clouds on the left (hidden at night). */
  clouds: Point[];
};

export type Layout = {
  mode: Mode;
  width: number;
  height: number;
  board: Anchor;
  /** The title's emblem: where the knocks' surprise comes from. */
  emblem: Point;
  /**
   * Boo, when the knocks bring a trick, in px from the emblem: where he lands (x, y) and his size,
   * where he flies off to, and his "boo!" (its top-left corner from his middle and its size, 0
   * where it has no room), beside him or hanging under the title with its tail up at him.
   */
  boo: { x: number; y: number; scale: number; away: Point; bubble: { x: number; y: number; scale: number; under: boolean } };
  moon: { x: number; y: number; r: number };
  /** The nine pumpkins on their vine, or null where there's no room for them. */
  sill: { pumpkins: Pumpkin[]; vine: string } | null;
  bats: Flight[];
  stars: Point[];
  /**
   * The ghost parade's lane: on a phone the band between the board and the pad (the one over the
   * board is the bats'), on a wide screen the sky over the board where it's roomy (else the band
   * under it), on a phone on its side or a short wide window the free band over the pad, where
   * they step out from behind the board: hidden left of `clip` (0 where nothing hides them).
   */
  parade: { y: number; from: number; to: number; scale: number; clip: number };
  /** Where a surprise's still frame (reduced motion) lines up: along the sill, or the free band of the side-by-side grid. */
  rest: number;
  scenery: Scenery | null;
};

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const TILTS = [-4, 3, -2, 5, -3, 2, -5, 3, -1];

/** How much of the moon is lit, 0 to 1: a sliver at the deal (more of one on an easy board), full when the board is. */
export const moonPhase = (filled: number) => clamp((filled - 0.25) / 0.75, 0.04, 1);

/** The lit part of a moon of radius 1 centred on 0,0, lit `k` of the way, from the right. */
export function moonPath(k: number): string {
  const rx = Math.abs(1 - 2 * k).toFixed(3);
  return `M0 -1A1 1 0 0 1 0 1A${rx} 1 0 0 ${k < 0.5 ? 0 : 1} 0 -1Z`;
}

/** A line through points, bending gently between each pair (`sag` px down, or across when vertical). */
function vinePath(points: Point[], sag: number, vertical: boolean): string {
  let d = `M${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let k = 1; k < points.length; k++) {
    const a = points[k - 1];
    const b = points[k];
    const s = k % 2 ? sag : -sag;
    d += vertical
      ? ` C${(a.x + s).toFixed(1)} ${(a.y + (b.y - a.y) / 3).toFixed(1)} ${(b.x + s).toFixed(1)} ${(b.y - (b.y - a.y) / 3).toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`
      : ` C${(a.x + (b.x - a.x) / 3).toFixed(1)} ${(a.y + Math.abs(s)).toFixed(1)} ${(b.x - (b.x - a.x) / 3).toFixed(1)} ${(b.y + Math.abs(s)).toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
  }
  return d;
}

/**
 * A row of nine from x to x + width, standing at `foot`: slot c under the board's column c, so each
 * third of the row stands for a column of boxes (top, middle, bottom).
 */
function sillRow(x: number, width: number, foot: number, size: number): NonNullable<Layout["sill"]> {
  const pumpkins = Array.from({ length: 9 }, (_, c) => ({
    x: x + (width * (c + 0.5)) / 9,
    y: foot,
    size,
    tilt: TILTS[c],
    box: (c % 3) * 3 + Math.floor(c / 3),
  }));
  const stalk = foot - size * 0.3;
  const points = [{ x: x + 4, y: stalk }, ...pumpkins.map((k) => ({ x: k.x, y: stalk })), { x: x + width - 4, y: stalk }];
  return { pumpkins, vine: vinePath(points, 4, false) };
}

/** The free band of a phone on its side: between the header and the pad, under the header. */
const sideBand = (p: Pieces) => ({ top: p.bar.y + p.bar.height, bottom: p.pad.y });

/** The band between the board and the pad: the gap under the board, the divider and its margin. */
const underBand = (p: Pieces) => ({ top: p.board.y + p.board.height, bottom: p.pad.y });

function sillOf(p: Pieces, mode: Mode): Layout["sill"] {
  const B = p.board;
  // Under the board, standing on the divider at the foot of the gap: at least 20px wide, where the
  // thin gap's row (below) leaves off, and growing with the gap past 24px, so a taller screen never
  // gets smaller pumpkins.
  if (mode !== "side" && p.gapB.height >= 20) {
    const size = Math.min(28, Math.max(20, p.gapB.height - 4));
    return sillRow(B.x, B.width, p.gapB.y + p.gapB.height, size);
  }
  // Beside the board, a pumpkin by each row of cells, so each third stands for the row of boxes
  // beside it (left, middle, right): the left margin of a phone on its side, else the right gutter
  // (close by the board, clear of a wide screen's moon). The left margin is the column's, inside the
  // shell's padding (the safe area's inset: an iPhone's rounded corners and its Dynamic Island).
  const left = mode === "side";
  const gutter = left ? B.x - p.game.x : p.shell.width - (B.x + B.width);
  if (gutter < 30) {
    // An upright phone with neither room: a smaller row filling the thin gap under the board, on the divider.
    if (!left) return sillRow(B.x, B.width, p.gapB.y + p.gapB.height, Math.max(14, p.gapB.height));
    // A phone on its side with no margin to spare: a row along the foot of the free band, over the pad.
    const band = sideBand(p);
    if (band.bottom - band.top < 40) return null;
    const size = Math.min(28, band.bottom - band.top - 12, p.pad.width / 9 - 6);
    return sillRow(p.pad.x, p.pad.width, band.bottom - 4, size);
  }
  const size = left ? Math.min(28, gutter - 14) : Math.min(26, gutter - 10);
  const x = left ? (p.game.x + B.x) / 2 : B.x + B.width + Math.min(gutter / 2, 26);
  const pumpkins = Array.from({ length: 9 }, (_, r) => ({
    x,
    y: B.y + (B.height * (r + 0.5)) / 9 + size * 0.45,
    size,
    tilt: TILTS[r],
    box: r,
  }));
  const points = [{ x, y: B.y + 6 }, ...pumpkins.map((k) => ({ x, y: k.y - size * 0.62 })), { x, y: B.y + B.height - 4 }];
  return { pumpkins, vine: vinePath(points, 7, true) };
}

/** Boo's "boo!" as drawn (halloween.css: 13px type), and how far it swells as it pops. */
const BUBBLE = { width: 46, height: 20, pop: 1.12 };

function booOf(p: Pieces, sideGrid: boolean, emblem: Point): Layout["boo"] {
  // Under the emblem where the band over the board takes him (a tablet), or in the free band of
  // the side-by-side grid, his "boo!" beside him; he flies off to the right, under the title's words.
  if (sideGrid || emblem.y + 68 <= p.board.y - 2)
    return { x: -16, y: 44, scale: 1, away: { x: 96, y: 36 }, bubble: { x: 16, y: -10, scale: 1, under: false } };
  // Else in the bar, between the gear and the title, as large as the room takes as he pops (40px
  // wide, 8% over): beside the emblem, or over it where that's too narrow (a long title on a small
  // phone), clear of the title's words (after the emblem, 19px, and its 7px gap). He flies straight
  // up, off the top of the screen.
  const gear = p.bar.x + 44;
  const end = p.title.x - gear >= 32 ? p.title.x : p.title.x + 26;
  const scale = clamp((end - gear - 4) / 43.2, 0.6, 1);
  const y = p.bar.y + p.bar.height / 2 - emblem.y;
  // His "boo!" beside him where the bar has room for the two before the title (the pair centred
  // there), else under the title, as small as the band over the board needs (left out where that's
  // too thin to read).
  const reach = 20 * scale - 4 + BUBBLE.width * BUBBLE.pop;
  if (end === p.title.x && 20 * scale + reach <= end - gear - 4) {
    const x = (gear + end - reach + 20 * scale) / 2 - emblem.x;
    return { x, y, scale, away: { x, y: y - 70 }, bubble: { x: 20 * scale - 4, y: -10 * scale, scale: 1, under: false } };
  }
  const x = (gear + end) / 2 - emblem.x;
  const top = p.title.y + p.title.height;
  const fit = Math.min(1, (p.board.y - 1 - top) / (BUBBLE.height * BUBBLE.pop));
  return { x, y, scale, away: { x, y: y - 70 }, bubble: { x: 20 * scale - 6, y: top - emblem.y - y, scale: fit >= 0.7 ? fit : 0, under: true } };
}

/**
 * The ground along the bottom of a wide screen: a ridge's height above the bottom edge at x. It
 * rolls on each side and drops to a thin strip under the game, so no edge shows through the pad.
 */
function ridge(x: number, p: Pieces, kind: "far" | "near"): number {
  const { game } = p;
  const away = x < game.x ? game.x - x : x > game.x + game.width ? x - game.x - game.width : 0;
  const t = clamp((away - 10) / 150, 0, 1);
  const ease = t * t * (3 - 2 * t);
  const side = kind === "far" ? 168 + 34 * Math.cos(x / 70 + 0.6) : 84 + 22 * Math.cos(x / 52 + 2.1);
  return 12 + (side - 12) * ease;
}

function ridgePath(p: Pieces, kind: "far" | "near"): string {
  const W = p.shell.width;
  const H = p.shell.height;
  let d = `M0 ${H}`;
  for (let x = 0; x <= W + 15; x += 16) d += `L${Math.min(x, W)} ${(H - ridge(Math.min(x, W), p, kind)).toFixed(1)}`;
  return `${d}L${W} ${H}Z`;
}

function sceneryOf(p: Pieces): Scenery {
  const W = p.shell.width;
  const H = p.shell.height;
  const S = p.game.x;
  const scale = clamp(S / 380, 0.72, 1.4);
  const right = p.game.x + p.game.width;
  const ground = (x: number, kind: "far" | "near") => H - ridge(x, p, kind);
  const patchAt = (x: number, size: number, box: number): Pumpkin => ({ x, y: ground(x, "near") + size * 0.18, size, tilt: TILTS[box], box });
  const cottageX = S * 0.2;
  const treeX = W - 6;
  return {
    scale,
    far: ridgePath(p, "far"),
    near: ridgePath(p, "near"),
    cottage: { x: cottageX, y: ground(cottageX + 60 * scale, "far") + 8 },
    tree: { x: treeX, y: ground(treeX - 40 * scale, "near") + 10 },
    ghost: { x: cottageX + 150 * scale, y: ground(cottageX + 60 * scale, "far") - 190 * scale },
    patch: [
      patchAt(S * 0.12, 38 * scale, 0),
      patchAt(S * 0.56, 30 * scale, 1),
      patchAt(S * 0.84, 42 * scale, 2),
      patchAt(right + S * 0.16, 40 * scale, 3),
      patchAt(right + S * 0.44, 32 * scale, 4),
      patchAt(right + S * 0.66, 36 * scale, 5),
    ],
    clouds: [
      { x: S * 0.3, y: H * 0.14 },
      { x: S * 0.66, y: H * 0.3 },
    ],
  };
}

export function layoutOf(p: Pieces): Layout {
  const W = p.shell.width;
  const H = p.shell.height;
  const B = p.board;
  // The side-by-side grid (a phone on its side, or a short wide window): the gaps are display:none,
  // 0×0 at the origin.
  const sideGrid = p.bar.x > B.x + B.width;
  const mode: Mode = p.game.x >= 160 ? "wide" : sideGrid ? "side" : "tall";
  const titleRight = p.title.x + p.title.width;
  // The round button at the bar's right-hand end (home).
  const button = p.bar.x + p.bar.width - 44;

  let moon: Layout["moon"];
  if (mode === "wide") {
    const r = clamp(p.game.x * 0.24, 56, 110);
    moon = { x: p.game.x + p.game.width + p.game.x * 0.56, y: Math.max(r + 48, H * 0.24), r };
  } else if (mode === "side") {
    // In the strip between the board and the controls; where that's too thin, in the sky over the
    // board, else at the top of the free band.
    const strip = p.bar.x - (B.x + B.width);
    if (strip >= 34) {
      const r = clamp(strip / 2 - 10, 14, 26);
      moon = { x: B.x + B.width + strip / 2, y: B.y + 8 + r, r };
    } else if (B.y >= 30) {
      const r = Math.min(18, (B.y - 8) / 2);
      moon = { x: B.x + B.width - r - 6, y: B.y / 2, r };
    } else {
      const band = sideBand(p);
      moon = { x: p.bar.x + p.bar.width - 20, y: band.top + 20, r: 14 };
    }
  } else {
    // Between the title and the right-hand button, 12px clear of the words. A long title on a
    // narrow phone ("Medium Puzzle 100") leaves too little room there: then tucked under the title's
    // end instead, over the board's top-right corner and left of the button, whichever is roomier.
    const gap = button - titleRight;
    const beside = Math.min(24, Math.max(12, gap * 0.24), (gap - 15) / 2);
    const top = p.title.y + p.title.height + 5;
    const bottom = B.y - 3;
    const tucked = Math.min(18, (bottom - top) / 2);
    if (beside >= Math.min(11, tucked)) {
      const r = Math.max(8, beside);
      moon = { x: clamp((titleRight + button) / 2 + 4, titleRight + 12 + r, button - 2 - r), y: p.bar.y + p.bar.height / 2, r };
    } else {
      const r = Math.max(8, tucked);
      moon = { x: button - 3 - r, y: (top + bottom) / 2, r };
    }
  }

  let bats: Flight[];
  let stars: Point[];
  let parade: Layout["parade"];
  if (mode === "wide") {
    const right = p.game.x + p.game.width;
    bats = [
      { y: moon.y - moon.r * 0.1, from: right - 20, to: W + 40, rest: moon.x - moon.r * 0.55, size: 30, seconds: 41, delay: -9 },
      { y: H * 0.2, from: -40, to: p.game.x + 20, rest: p.game.x * 0.36, size: 24, seconds: 45, delay: -27 },
    ];
    const S = p.game.x;
    stars = [
      { x: S * 0.08, y: H * 0.11 },
      { x: S * 0.22, y: H * 0.05 },
      { x: S * 0.5, y: H * 0.2 },
      { x: S * 0.9, y: H * 0.08 },
      { x: right + S * 0.12, y: H * 0.36 },
      { x: right + S * 0.08, y: H * 0.07 },
      { x: right + S * 0.93, y: H * 0.1 },
      { x: right + S * 0.95, y: H * 0.42 },
    ];
    // A short wide window keeps its hills and moon, but its gaps are gone: the free band over the
    // pad. Else the sky over the board, or where that's thin (a laptop) the band under it, the
    // ghosts as large as the lane takes (the tallest is 1.12 × 30px at scale 1).
    const band = sideBand(p);
    const under = underBand(p);
    const lane = p.gapA.height >= 40 ? { top: p.gapA.y, bottom: p.gapA.y + p.gapA.height } : under;
    parade = sideGrid
      ? { y: (band.top + band.bottom) / 2, from: B.x + B.width - 20, to: W + 50, scale: 1, clip: B.x + B.width + 2 }
      : { y: (lane.top + lane.bottom) / 2, from: -60, to: W + 60, scale: clamp((lane.bottom - lane.top - 4) / 33.6, 0.6, 1.3), clip: 0 };
  } else if (mode === "side") {
    const band = sideBand(p);
    const y = (band.top + band.bottom) / 2;
    bats = [{ y: y - 10, from: B.x + B.width - 10, to: W + 30, rest: p.bar.x + p.bar.width * 0.3, size: 20, seconds: 34, delay: -12 }];
    stars = [
      { x: p.game.x + (B.x - p.game.x) * 0.3, y: 10 },
      { x: moon.x - moon.r - 12, y: moon.y + moon.r + 30 },
      { x: p.bar.x + p.bar.width * 0.62, y: band.top + 14 },
      { x: p.bar.x + p.bar.width * 0.9, y: band.bottom - 16 },
    ];
    parade = { y, from: B.x + B.width - 20, to: W + 50, scale: 1, clip: B.x + B.width + 2 };
  } else {
    const roomy = p.gapA.height >= 20;
    const y = roomy ? p.gapA.y + p.gapA.height / 2 : p.bar.y + 6;
    bats = [
      { y: y - 2, from: -30, to: W + 30, rest: W * 0.22, size: 18, seconds: 31, delay: -6 },
      { y: y + 3, from: -30, to: W + 30, rest: W * 0.52, size: 13, seconds: 43, delay: -24 },
    ];
    const band = roomy ? p.gapA.y : p.bar.y + p.bar.height;
    stars = [
      { x: W * 0.05, y: band + 10 },
      { x: (p.bar.x + 44 + p.title.x) / 2 + 8, y: p.bar.y + 4 },
      { x: W * 0.37, y: band + (roomy ? 20 : 4) },
      { x: W * 0.66, y: band + 6 },
      { x: W * 0.95, y: band + (roomy ? 18 : 6) },
    ];
    // Between the board and the pad, the ghosts small enough for a thin band (an iPhone SE's), so
    // they never cover the bottom row's digits or the keys.
    const under = underBand(p);
    parade = { y: (under.top + under.bottom) / 2, from: -50, to: W + 50, scale: clamp((under.bottom - under.top - 4) / 33.6, 0.6, 1), clip: 0 };
  }

  const emblem = { x: p.title.x + 8, y: p.title.y + p.title.height / 2 };
  return {
    mode,
    width: W,
    height: H,
    board: B,
    emblem,
    boo: booOf(p, sideGrid, emblem),
    moon,
    sill: sillOf(p, mode),
    bats,
    stars,
    parade,
    // Along the sill's pumpkins on the divider, else the middle of the free band.
    rest: sideGrid ? parade.y : p.gapB.y + p.gapB.height - Math.min(28, p.gapB.height) / 2,
    scenery: mode === "wide" ? sceneryOf(p) : null,
  };
}
