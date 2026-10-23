// The Blossom garden's geometry, pure: where each of the nine flowers stands, the branch (or the
// tree), the sun and moon, the hills, the bee's and the swallow's flights and the rainbow, all
// worked out from the game's measured pieces (px from the shell's top-left), so the Backdrop and
// the Overlay agree on where everything is.
//
// Three layouts: "row" (a phone held upright, a narrow window) lines the flowers up in the gap
// under the board, one under each ninth of the board's columns, on the divider or peeking over it;
// "pane" (a phone on its side) stands them on the pad in the empty band under the header; "plot" (a
// window with room on both sides of the game) plants them as a 3×3 bed on the right-hand hill,
// mirroring the board's boxes, beside a whole cherry tree on the left.

import { mulberry32 } from "@/lib/random";

export type Rect = { x: number; y: number; width: number; height: number };
/** The game's pieces (use-anchor.ts): on a phone on its side the gaps and the divider are 0×0. */
export type Pieces = {
  shell: Rect;
  bar: Rect;
  title: Rect;
  gapA: Rect;
  board: Rect;
  gapB: Rect;
  rule: Rect;
  pad: Rect;
  dock: Rect;
};
export type Pt = { x: number; y: number };

export type Mode = "row" | "pane" | "plot";
export type FlowerKind = "tulip-1" | "tulip-2" | "tulip-3" | "daisy" | "cherry";

/** A flower's drawing: a 24×40 viewBox, the ground at y 40, the open head centred at (12, 10). */
const FLOWER_W = 24;
const FLOWER_H = 40;
const HEAD_Y = 10;

/**
 * The flowers by box column, then box row: every row and column of the 3×3 holds one tulip, one
 * daisy and one cherry blossom (a little Latin square for a Sudoku garden).
 */
const KINDS: readonly (readonly FlowerKind[])[] = [
  ["tulip-1", "daisy", "cherry"],
  ["daisy", "cherry", "tulip-2"],
  ["cherry", "tulip-3", "daisy"],
];
const kindOf = (box: number): FlowerKind => KINDS[box % 3][Math.floor(box / 3)];

export type Slot = {
  box: number;
  kind: FlowerKind;
  /** The foot of the stem (centre x, ground y) and the drawing's box. */
  x: number;
  y: number;
  w: number;
  h: number;
  /** Left-to-right place in a row (0–8), or the plot column (0–2), for waves that cross the garden. */
  col: number;
  /** The plot's depth row, back (0) to front (2); 0 in a row. */
  depth: number;
  /** Where the open head sits, and its radius. */
  head: Pt;
  r: number;
  /** Where the divider cuts the stem (y), when the flower grows from behind it. */
  cut?: number;
};

/** The branch over the garden: a corner branch, a branch hanging in the strip beside the board, or a tree. */
export type Branch = {
  kind: "corner" | "hang" | "tree";
  /** The drawing's box in px and its viewBox size. */
  box: Rect;
  view: { width: number; height: number };
  /** Every blossom cluster shown, in px, in the order they open. */
  clusters: Pt[];
  /** Which of the drawing's clusters those are, by index (the corner's leave out any over the gear). */
  shown: number[];
  /** Where a bird perches (the tip). */
  perch: Pt;
};

export type Hills = { back: string; front: string };

export type Bed = {
  /** The soil bed's top, and the planks' front face below it. */
  soil: string;
  front: string;
  /** The skep beehive's foot (centre) and size. */
  hive: { x: number; y: number; size: number };
};

export type Flight = { d: string; segs: Seg[] };

export type Garden = {
  mode: Mode;
  width: number;
  height: number;
  /** The nine flowers by box (slots[b] is box b's), or none when there is no room. */
  slots: Slot[];
  branch: Branch;
  sun: { x: number; y: number; size: number };
  /** The moon (size 0 where a long title leaves it no room), and its glint's ring (a hint's, the rainbow's) as a multiple of its size. */
  moon: { x: number; y: number; size: number; glint: number };
  stars: Pt[];
  clouds: (Pt & { size: number })[];
  hills: Hills;
  bed: Bed | null;
  /** The ambient petals' lanes (x in px) and their resting heights (still, under reduced motion). */
  lanes: { x: number; rest: number }[];
  /** The zones the payoff's butterflies and fireflies loop in: about the branch where it has room, then over the flowers. */
  zones: Rect[];
  /** The bumblebee's flight, and when (0–1 of it) it passes over each box's flower. */
  bee: Flight & { visits: number[]; size: number };
  /** The swallow's swoop at the season's arrival, and its size. */
  swallow: Flight & { size: number };
  /** The rainbow: its centre, outer radius and band width (the Overlay finds the keys 1–7 it rises from). */
  bow: { cx: number; cy: number; r: number; band: number };
};

/** One cubic Bézier: start, two controls, end. */
export type Seg = [Pt, Pt, Pt, Pt];

const round = (n: number) => Math.round(n * 10) / 10;
const pt = (x: number, y: number): Pt => ({ x, y });

export function gardenLayout(p: Pieces): Garden {
  const { shell, board, pad } = p;
  const width = shell.width;
  const height = shell.height;
  const landscape = board.x + board.width <= pad.x;
  // The tree and the bed want a side panel each, the bed's plot at least 140px across. A short
  // window keeps them too: the tree scales with its height and the bed sits by its floor, and
  // below the CSS's 520px breakpoint the game is on its side (`landscape`) anyway.
  const wide = !landscape && rightPanel(p).width >= 200;
  const mode: Mode = wide ? "plot" : landscape ? "pane" : "row";
  const slots = mode === "plot" ? plotSlots(p) : rowSlots(p, mode);
  const bed = mode === "plot" && slots.length ? plotBed(p, slots) : null;
  const branch = mode === "plot" ? tree(p) : mode === "pane" ? hanging(p) : corner(p);
  return {
    mode,
    width,
    height,
    slots,
    branch,
    ...sky(p, mode),
    hills: hills(p, mode, slots),
    bed,
    lanes: lanes(p, mode),
    zones: zones(p, mode, slots, branch),
    bee: beeFlight(p, mode, slots, bed, branch),
    swallow: swallowFlight(p, mode, branch),
    bow: rainbow(p),
  };
}

/** The head of a flower drawn w×h with its foot at (x, y). */
function headOf(x: number, y: number, w: number, h: number) {
  const s = Math.min(w / FLOWER_W, h / FLOWER_H);
  return { head: pt(x, y - (FLOWER_H - HEAD_Y) * s), r: 8.5 * s };
}

/**
 * A row of nine: under the board, each flower under its ninth of the columns, or, on a phone on its
 * side, across the pad's width in the band under the header, standing on the pad's top. Under the
 * board they stand on the divider where the gap has room (a tall phone, a tablet); in a short gap
 * they grow from the pad's top instead, the divider cutting their stems, so they peek over it.
 * Either way no flower stands behind a key.
 */
function rowSlots({ board, bar, rule, pad }: Pieces, mode: Mode): Slot[] {
  const across = mode === "pane" ? pad : board;
  const pitch = across.width / 9;
  const top = mode === "pane" ? bar.y + bar.height + 6 : board.y + board.height + 3;
  const most = mode === "row" ? Math.min(92, pitch * 1.7) : 52;
  const ground = mode === "row" && rule.height ? rule.y : pad.y;
  const base = Math.max(ground, Math.min(pad.y, top + most));
  const h = Math.min(most, base - top);
  if (h < 16) return [];
  const w = Math.min(mode === "row" ? Math.max(34, pitch * 0.9) : 34, pitch - 4);
  const cut = base > ground ? { cut: ground } : {};
  const slots: Slot[] = [];
  for (let s = 0; s < 9; s++) {
    // Slot s stands under box column ⌊s/3⌋; within its trio, the box rows top to bottom.
    const box = (s % 3) * 3 + Math.floor(s / 3);
    const x = across.x + (s + 0.5) * pitch;
    slots[box] = { box, kind: kindOf(box), x, y: base, w, h, col: s, depth: 0, ...headOf(x, base, w, h), ...cut };
  }
  return slots;
}

/** The game's column: the board, the header, the pad and the dock (on a phone on its side, both columns). */
const column = ({ board, bar, pad, dock }: Pieces) => [board, bar, pad, dock];

/** The right-hand panel of a wide screen, clear of the game's column (wider than the board in a short window). */
function rightPanel(p: Pieces) {
  const x = Math.max(...column(p).map((r) => r.x + r.width)) + 16;
  return { x, width: p.shell.width - x };
}

/** The left edge of the game's column. */
const leftEdge = (p: Pieces) => Math.min(...column(p).map((r) => r.x));

/** A 3×3 bed on the right-hand hill, box b at depth row ⌊b/3⌋ (back to front), column b % 3. */
function plotSlots(p: Pieces): Slot[] {
  const panel = rightPanel(p);
  const plotW = Math.min(290, panel.width - 60);
  if (plotW < 140) return [];
  const plotH = plotW * 0.64;
  const cx = panel.x + panel.width / 2;
  const bottom = p.shell.height * 0.93;
  const top = bottom - plotH;
  const slots: Slot[] = [];
  for (let box = 0; box < 9; box++) {
    const depth = Math.floor(box / 3);
    const col = box % 3;
    const z = [0.72, 0.86, 1][depth];
    const y = top + plotH * [0.34, 0.64, 0.94][depth];
    // A touch of perspective: the back rows narrower, sheared toward the middle.
    const x = cx + (col - 1) * (plotW / 3) * z + (col - 1) * (1 - z) * -6;
    // The front row's flowers 80px tall (on a 290px bed), the rows behind smaller.
    const h = (plotW / 290) * 80 * z;
    const w = (h * FLOWER_W) / FLOWER_H;
    slots[box] = { box, kind: kindOf(box), x, y, w, h, col, depth, ...headOf(x, y, w, h) };
  }
  return slots;
}

function plotBed(p: Pieces, slots: Slot[]): Bed {
  const back = slots[1];
  const front = slots[7];
  const halfBack = Math.abs(slots[2].x - slots[0].x) / 2 + back.w * 0.85;
  const halfFront = Math.abs(slots[8].x - slots[6].x) / 2 + front.w * 0.85;
  const yb = back.y - back.h * 0.24;
  const yf = front.y + front.w * 0.34;
  const cx = back.x;
  const [bl, br, fr, fl] = [pt(cx - halfBack, yb), pt(cx + halfBack, yb), pt(cx + halfFront, yf), pt(cx - halfFront, yf)];
  const soil = `M${round(bl.x)} ${round(bl.y)}L${round(br.x)} ${round(br.y)}L${round(fr.x)} ${round(fr.y)}L${round(fl.x)} ${round(fl.y)}Z`;
  const plank = Math.max(10, front.h * 0.16);
  const frontFace = `M${round(fl.x)} ${round(fl.y)}L${round(fr.x)} ${round(fr.y)}L${round(fr.x)} ${round(fr.y + plank)}L${round(fl.x)} ${round(fl.y + plank)}Z`;
  const panel = rightPanel(p);
  const size = Math.min(50, front.h * 0.66);
  const hiveX = Math.min(panel.x + panel.width - size * 0.62, fr.x + size * 0.72);
  return { soil, front: frontFace, hive: { x: hiveX, y: yf + plank, size } };
}

/**
 * The corner branch over the gear, its tip short of the title (its emblem first); a long title on a
 * narrow phone gets a shorter branch. Where the header sits away from the corner (a tablet), it
 * stops short of the gear instead. Its clusters in the viewBox 0 0 170 64.
 *
 * The gear's button is see-through, so where the bark runs over it the branch is raised until the
 * bark's underside (y 19 in the viewBox at most) clears the button's top, and a cluster that would
 * come within 2px of it (its three blossoms spread up to 15 from its point in the viewBox, on a
 * full board; the breeze sways them a little) is left out, twig and all; the first one shown opens
 * first.
 */
export const CORNER_CLUSTERS: readonly Pt[] = [pt(84, 44), pt(98, 19), pt(112, 37), pt(126, 13), pt(139, 31), pt(152, 21), pt(164, 13)];
const CLUSTER_REACH = 15;
function corner({ bar, title }: Pieces): Branch {
  const reach = bar.x - 8 >= 72 ? bar.x - 8 : title.x - 14;
  const width = Math.max(72, Math.min(170, reach));
  const s = width / 170;
  // The gear: the header's first 44px round button, centred in its height.
  const gear = pt(bar.x + 22, bar.y + bar.height / 2);
  const lift = bar.x < width ? Math.max(0, 19 * s - (gear.y - 22)) : 0;
  const at = (v: Pt) => pt(v.x * s, v.y * s - lift);
  const shown = CORNER_CLUSTERS.flatMap((c, k) => (Math.hypot(at(c).x - gear.x, at(c).y - gear.y) < 22 + 2 + CLUSTER_REACH * s ? [] : [k]));
  return {
    kind: "corner",
    box: { x: 0, y: -lift, width, height: 64 * s },
    view: { width: 170, height: 64 },
    clusters: shown.map((k) => at(CORNER_CLUSTERS[k])),
    shown,
    perch: at(pt(118, 33)),
  };
}

/** A weeping branch hanging into the strip between the board and the right-hand column. ViewBox 0 0 70 220. */
export const HANG_CLUSTERS: readonly Pt[] = [pt(44, 30), pt(26, 56), pt(48, 82), pt(22, 110), pt(44, 136), pt(26, 164), pt(38, 196)];
function hanging({ board, pad }: Pieces): Branch {
  const strip = pad.x - (board.x + board.width);
  const width = Math.max(40, Math.min(70, strip - 8));
  const s = width / 70;
  const x = board.x + board.width + (strip - width) / 2;
  const at = (v: Pt) => pt(x + v.x * s, v.y * s);
  return {
    kind: "hang",
    box: { x, y: 0, width, height: 220 * s },
    view: { width: 70, height: 220 },
    clusters: HANG_CLUSTERS.map(at),
    shown: HANG_CLUSTERS.map((_, k) => k),
    perch: at(pt(34, 122)),
  };
}

/** A limb of the tree: its path and stroke width (viewBox 0 0 380 800). */
type Limb = { d: string; w: number };

/**
 * The cherry tree, grown once from a fixed seed: four limbs from a fork low on the trunk, each
 * forking two or three ways, three times over, then fitted to the panel's canopy (x 14–366,
 * y 92 to the fork at 548). Its 21 blossom clusters are tips spread around the crown, opening in
 * a shuffled order so the crown fills evenly; every other tip carries a bud.
 */
function growTree() {
  const rng = mulberry32(0xb10550);
  const raw: { from: Pt; mid: Pt; to: Pt; w: number }[] = [];
  const ends: Pt[] = [];
  const grow = (from: Pt, angle: number, length: number, w: number, depth: number) => {
    const to = pt(from.x + Math.cos(angle) * length, from.y + Math.sin(angle) * length);
    const bend = (rng() - 0.5) * length * 0.35;
    const mid = pt((from.x + to.x) / 2 - Math.sin(angle) * bend, (from.y + to.y) / 2 + Math.cos(angle) * bend);
    raw.push({ from, mid, to, w });
    if (depth === 0) {
      ends.push(to);
      return;
    }
    const kids = depth < 3 && rng() < 0.4 ? 3 : 2;
    const spread = 0.34 + rng() * 0.16;
    for (let k = 0; k < kids; k++) {
      const turn = kids === 2 ? (k ? spread : -spread) : (k - 1) * spread * 1.2;
      // Limbs lean a little back toward the light as they fork.
      const a = angle + turn + (-Math.PI / 2 - angle) * 0.12 + (rng() - 0.5) * 0.18;
      grow(to, a, length * (0.68 + rng() * 0.12), Math.max(1.4, w * 0.62), depth - 1);
    }
  };
  [-2.42, -1.92, -1.28, -0.74].forEach((a, k) => grow(pt(0, 0), a, [100, 118, 118, 100][k], [17, 21, 21, 17][k], 3));
  const xs = raw.flatMap((r) => [r.from.x, r.mid.x, r.to.x]);
  const ys = raw.flatMap((r) => [r.from.y, r.mid.y, r.to.y]);
  const [minX, maxX, minY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys)];
  const FORK = pt(186, 548);
  const fit = (v: Pt) => pt(FORK.x + v.x * (v.x < 0 ? (FORK.x - 14) / -minX : (366 - FORK.x) / maxX), FORK.y + v.y * ((FORK.y - 92) / -minY));
  const limbs: Limb[] = raw.map(({ from, mid, to, w }) => {
    const [a, b, c] = [fit(from), fit(mid), fit(to)];
    return { d: `M${round(a.x)} ${round(a.y)}Q${round(b.x)} ${round(b.y)} ${round(c.x)} ${round(c.y)}`, w: round(w) };
  });
  const tips = ends.map(fit);
  // 21 clusters spread around the crown (by angle from the fork), opening in a shuffled order.
  const around = [...tips].sort((a, b) => Math.atan2(a.y - FORK.y, a.x - FORK.x) - Math.atan2(b.y - FORK.y, b.x - FORK.x));
  const picked = Array.from({ length: 21 }, (_, k) => around[Math.floor(((k + 0.5) * around.length) / 21)]);
  const order = picked.map((p) => ({ p, key: rng() }));
  order.sort((a, b) => a.key - b.key);
  const clusters = order.map((o) => o.p);
  const buds = tips.filter((t) => !picked.includes(t));
  return { limbs, clusters, buds, fork: FORK };
}

export const TREE = growTree();
/** The tree's clusters in the viewBox 0 0 380 800, in the order they open. */
export const TREE_CLUSTERS: readonly Pt[] = TREE.clusters;

function tree(p: Pieces): Branch {
  const { shell } = p;
  const width = leftEdge(p) - 16;
  const s = Math.min(width / 380, shell.height / 800);
  const ox = (width - 380 * s) / 2;
  const oy = shell.height - 800 * s;
  const at = (v: Pt) => pt(ox + v.x * s, oy + v.y * s);
  // The swallow perches on the tip nearest the top right, toward the board.
  const perch = TREE_CLUSTERS.reduce((best, c) => (c.x - c.y > best.x - best.y ? c : best));
  return {
    kind: "tree",
    box: { x: ox, y: oy, width: 380 * s, height: 800 * s },
    view: { width: 380, height: 800 },
    clusters: TREE_CLUSTERS.map(at),
    shown: TREE_CLUSTERS.map((_, k) => k),
    perch: at(pt(perch.x, perch.y - 8)),
  };
}

function sky(p: Pieces, mode: Mode) {
  const { shell, bar, title } = p;
  if (mode === "plot") {
    const panel = rightPanel(p);
    const cx = panel.x + panel.width * 0.62;
    const left = (leftEdge(p) - 16) / 2;
    // The stars keep to the panels, clear of the game's column however narrow they are.
    const inLeft = (x: number) => Math.max(14, Math.min(leftEdge(p) - 30, x));
    const inRight = (x: number) => Math.max(panel.x + 14, Math.min(panel.x + panel.width - 14, x));
    return {
      sun: { x: cx, y: 96, size: 130 },
      moon: { x: cx, y: 92, size: 30, glint: 2.6 },
      stars: [
        pt(inLeft(left - 120), 34),
        pt(inLeft(left + 30), 22),
        pt(inLeft(left + 140), 58),
        pt(inRight(cx - 120), 52),
        pt(inRight(cx + 70), 160),
        pt(panel.x + panel.width - 30, 30),
      ],
      clouds: [
        { ...pt(panel.x + panel.width * 0.3, 214), size: 1 },
        { ...pt(left + 40, 46), size: 0.8 },
      ],
    };
  }
  // The free sky right of the title, short of the home button: the moon a little right of its
  // middle (smaller where a long title leaves little room), three stars about it. The moon is at
  // least 14px, which needs 16px of room to keep clear of the title and the home button; with
  // less, only the stars show.
  const free = title.x + title.width;
  const home = bar.x + bar.width - 44;
  const room = Math.max(0, home - free);
  const mx = (free + home) / 2 + Math.min(6, room * 0.08);
  const size = room < 16 ? 0 : Math.max(14, Math.min(22, room - 12));
  // The glint's ring grows from 0.9 to 1.5 times its width as it fades out: until it has faded to
  // half (1.2 times) it keeps clear of the title and the round home button, and it starts just
  // outside the moon at the least.
  const clear = Math.min(mx - free, Math.hypot(home + 22 - mx, bar.y + bar.height / 2 - 20) - 22);
  return {
    sun: { x: shell.width + 15, y: 15, size: 110 },
    moon: { x: mx, y: 20, size, glint: size ? Math.max(1.2, Math.min(2.6, clear / (0.6 * size))) : 0 },
    stars: [
      pt(free + room * 0.12, 9),
      pt(home - room * 0.14, 40),
      pt(mx - room * 0.3, 44),
      pt(8, bar.y + bar.height + 36),
      pt(shell.width - 8, p.board.y + p.board.height * 0.4),
      pt(7, p.board.y + p.board.height * 0.92),
    ],
    clouds: [],
  };
}

/** Two layers of hills along the bottom; on a wide screen, a big hill on the right for the bed. */
function hills({ shell, board }: Pieces, mode: Mode, slots: Slot[]): Hills {
  const W = shell.width;
  const H = shell.height;
  if (mode === "plot" && slots.length) {
    const top = slots[1].y - slots[1].h * 0.5;
    const right = board.x + board.width;
    const back = [
      `M0 ${round(H * 0.8)}`,
      `C${round(W * 0.12)} ${round(H * 0.76)} ${round(board.x * 0.8)} ${round(H * 0.84)} ${round(board.x + 40)} ${round(H * 0.9)}`,
      `S${round(right - 60)} ${round(H * 0.9)} ${round(right + 30)} ${round(H * 0.82)}`,
      `S${round(slots[1].x - 120)} ${round(top)} ${round(slots[1].x)} ${round(top - 6)}`,
      `S${round(W - 20)} ${round(top + 20)} ${W} ${round(top + 30)}`,
      `V${H}H0Z`,
    ].join(" ");
    const front = [
      `M0 ${round(H * 0.9)}`,
      `C${round(W * 0.15)} ${round(H * 0.86)} ${round(W * 0.3)} ${round(H * 0.95)} ${round(W * 0.5)} ${round(H * 0.95)}`,
      `S${round(W * 0.68)} ${round(H * 0.93)} ${round(right + 10)} ${round(H * 0.94)}`,
      `S${round(W * 0.92)} ${round(H * 0.97)} ${W} ${round(H * 0.95)}`,
      `V${H}H0Z`,
    ].join(" ");
    return { back, front };
  }
  const t = Math.min(140, Math.max(26, H * 0.09));
  const back = `M0 ${round(H - t * 0.62)} Q${round(W * 0.16)} ${round(H - t * 1.02)} ${round(W * 0.34)} ${round(H - t * 0.74)} T${round(W * 0.68)} ${round(H - t * 0.8)} T${W} ${round(H - t * 0.86)} V${H}H0Z`;
  const front = `M0 ${round(H - t * 0.3)} Q${round(W * 0.22)} ${round(H - t * 0.6)} ${round(W * 0.44)} ${round(H - t * 0.36)} T${round(W * 0.86)} ${round(H - t * 0.4)} T${W} ${round(H - t * 0.46)} V${H}H0Z`;
  return { back, front };
}

/**
 * The ambient petals' lanes: the gutters and gaps on a phone, the two panels on a wide screen.
 * Every other one rests still under reduced motion, where nothing covers it: in a row layout the
 * gap under the header, the gap under the board (between two flowers) and the strip under the
 * dock; on a phone on its side the left gutter, the strip beside the board and the band over the
 * flowers.
 */
function lanes({ shell, board, bar, gapA, gapB, pad, dock }: Pieces, mode: Mode) {
  const W = shell.width;
  const H = shell.height;
  const xs =
    mode === "plot"
      ? [0.03, 0.09, 0.16, 0.23, 0.27, 0.73, 0.79, 0.87, 0.95].map((f) => f * W)
      : mode === "pane"
        ? [board.x * 0.4, board.x * 0.85, board.x + board.width + 14, board.x + board.width + 52, W * 0.66, W * 0.8, W * 0.94]
        : // The middle lane between the fifth and the sixth flowers, so its petal rests among them.
          [0.04 * W, 0.11 * W, 0.19 * W, 0.26 * W, board.x + (board.width * 5) / 9 - 5, 0.76 * W, 0.88 * W];
  // A petal is 12px tall: these centre it on its band.
  const middle = (top: number, bottom: number) => (top + bottom) / 2 - 6;
  const sky = middle(gapA.y, gapA.y + gapA.height);
  const foot = middle(dock.y + dock.height, H);
  const rows = [sky, H * 0.47, foot, H * 0.31, middle(gapB.y, gapB.y + gapB.height), H * 0.24, sky, H * 0.4, H * 0.82];
  const band = (f: number) => bar.y + bar.height + (pad.y - bar.y - bar.height) * f;
  const sides = [H * 0.18, H * 0.47, H * 0.71, H * 0.31, band(0.3), H * 0.24, band(0.5)];
  const fractions = [0.18, 0.47, 0.71, 0.31, 0.58, 0.24, 0.66, 0.4, 0.82];
  return xs.map((x, k) => ({ x, rest: mode === "row" ? rows[k] : mode === "pane" ? sides[k] : H * fractions[k] }));
}

/**
 * Where the payoff flutters: one zone about the branch, one over the flowers. Upright, the branch's
 * zone keeps right of the gear (its button is see-through) and short of the title where the branch
 * runs over the gear, and runs from the corner to the branch's tip where it stops short of it (a
 * tablet). A butterfly (18px) loops from 12% to 86% of its zone's width, so a zone 36px wide keeps
 * it clear of the gear and the title; where there is less room, only the flowers have one.
 */
function zones({ shell, bar, title }: Pieces, mode: Mode, slots: Slot[], branch: Branch): Rect[] {
  const b = branch.box;
  const [from, to] = bar.x < b.width ? [bar.x + 50, title.x - 4] : [8, b.x + b.width];
  const branchZone =
    mode === "plot"
      ? {
          x: b.x + b.width * 0.15,
          y: b.y + b.height * 0.1,
          width: b.width * 0.7,
          height: b.height * 0.4,
        }
      : mode === "pane"
        ? { x: b.x - 10, y: 40, width: b.width + 20, height: 160 }
        : to - from >= 36
          ? { x: from, y: 2, width: to - from, height: 54 }
          : null;
  const near = branchZone ? [branchZone] : [];
  if (!slots.length) return near;
  const xs = slots.map((s) => s.head.x);
  const ys = slots.map((s) => s.head.y);
  const pad = mode === "plot" ? 40 : 6;
  const flowerZone = {
    x: Math.max(0, Math.min(...xs) - pad),
    y: Math.min(...ys) - (mode === "plot" ? 60 : 8),
    width: Math.min(shell.width, Math.max(...xs) + pad) - Math.max(0, Math.min(...xs) - pad),
    height: Math.max(...ys) - Math.min(...ys) + (mode === "plot" ? 70 : 14),
  };
  return [...near, flowerZone];
}

/** Zone k's two fireflies: where each glows from, and how far it wanders (the sdkBlossomFirefly keyframes' --dx and --dy). */
export function firefliesIn(z: Rect, k: number) {
  return [0, 1].map((j) => ({
    x: z.x + z.width * (j ? 0.72 : 0.24),
    y: z.y + z.height * (j ? 0.3 : 0.62),
    dx: (j ? -1 : 1) * Math.min(60, z.width * 0.2),
    dy: (k ? -1 : 1) * Math.min(24, z.height * 0.4),
  }));
}

// ── flights ───────────────────────────────────────────────────────────────

/** Smooth cubic segments through the points (Catmull-Rom). */
function through(points: Pt[], tension = 1): Seg[] {
  const segs: Seg[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    const k = tension / 6;
    segs.push([p1, pt(p1.x + (p2.x - p0.x) * k, p1.y + (p2.y - p0.y) * k), pt(p2.x - (p3.x - p1.x) * k, p2.y - (p3.y - p1.y) * k), p2]);
  }
  return segs;
}

const bez = ([a, b, c, d]: Seg, t: number): Pt => {
  const u = 1 - t;
  return pt(
    u * u * u * a.x + 3 * u * u * t * b.x + 3 * u * t * t * c.x + t * t * t * d.x,
    u * u * u * a.y + 3 * u * u * t * b.y + 3 * u * t * t * c.y + t * t * t * d.y,
  );
};

/** Each segment's length (sampled). */
function lengths(segs: Seg[]): number[] {
  return segs.map((seg) => {
    let len = 0;
    let prev = seg[0];
    for (let k = 1; k <= 24; k++) {
      const next = bez(seg, k / 24);
      len += Math.hypot(next.x - prev.x, next.y - prev.y);
      prev = next;
    }
    return len;
  });
}

/** The point a fraction (0–1) of the way along the flight, by distance. */
export function pointAlong(segs: Seg[], fraction: number): Pt {
  const lens = lengths(segs);
  let left = Math.max(0, Math.min(1, fraction)) * lens.reduce((a, b) => a + b, 0);
  for (let i = 0; i < segs.length; i++) {
    if (left <= lens[i] || i === segs.length - 1) return bez(segs[i], lens[i] ? Math.min(1, left / lens[i]) : 0);
    left -= lens[i];
  }
  return segs[0][0];
}

const pathOf = (segs: Seg[]) =>
  segs.length
    ? `M${round(segs[0][0].x)} ${round(segs[0][0].y)} ` +
      segs.map(([, b, c, d]) => `C${round(b.x)} ${round(b.y)} ${round(c.x)} ${round(c.y)} ${round(d.x)} ${round(d.y)}`).join(" ")
    : "";

/**
 * The bee: in from the side, a hop over every flower (a little waggle dance, a figure of eight,
 * over the middle one), then away. On a wide screen it starts at the hive and zigzags the bed; on
 * a phone on its side it leaves up past the hanging branch rather than across the board; upright
 * it keeps to the gap between the board and the pad, clear of both.
 */
function beeFlight({ shell, board, bar, pad }: Pieces, mode: Mode, slots: Slot[], bed: Bed | null, branch: Branch): Garden["bee"] {
  const size = mode === "plot" ? 28 : 22;
  // The bee's height, and the band its middle may fly in upright.
  const tall = (size * 20) / 24;
  const gapTop = board.y + board.height + tall / 2 + 1;
  const gapBottom = Math.max(gapTop, pad.y - tall / 2 - 1);
  const [lo, hi] = mode === "row" ? [gapTop, gapBottom] : [-Infinity, Infinity];
  /** A height within the band, `margin` inside it (its middle if it is too narrow). */
  const keep = (y: number, margin = 0) => (hi - lo < margin * 2 ? (lo + hi) / 2 : Math.min(Math.max(y, lo + margin), hi - margin));
  const order = slots.length ? (mode === "plot" ? [8, 7, 6, 3, 4, 5, 2, 1, 0] : [...slots].sort((a, b) => b.col - a.col).map((s) => s.box)) : [];
  if (!order.length) {
    // No flowers: along the gap under the board or, on a phone on its side, across the band under
    // the header and up the strip beside the board.
    const W = shell.width;
    const strip = branch.box.x + branch.box.width / 2;
    const y = mode === "pane" ? (bar.y + bar.height + pad.y) / 2 : (gapTop + gapBottom) / 2;
    const segs = through(mode === "pane" ? [pt(W + 30, y), pt(strip, y + 10), pt(strip, -40)] : [pt(W + 30, y), pt(W / 2, y - 4), pt(-30, y)]);
    return { d: pathOf(segs), segs, visits: Array(9).fill(0.5), size };
  }
  // The waggle's figure of eight swings about a third of its radius up and down.
  const wag = mode === "plot" ? 20 : 13;
  const above = (b: number) => pt(slots[b].head.x, keep(slots[b].head.y - slots[b].r * (mode === "plot" ? 1.4 : 0.5), wag * 0.35));
  const first = above(order[0]);
  const last = above(order[8]);
  const start = mode === "plot" && bed ? pt(bed.hive.x, bed.hive.y - bed.hive.size * 0.55) : pt(shell.width + 30, keep(first.y - 18));
  const end = mode === "plot" ? pt(shell.width + 40, slots[1].y - 260) : pt(-40, keep(last.y - 22));
  const hop = mode === "plot" ? 22 : 7;
  const segs: Seg[] = [];
  // A hop's controls never rise out of the band, so neither does the hop.
  const hopTo = (a: Pt, b: Pt, lift: number) => {
    const top = Math.max(lo, Math.min(a.y, b.y) - lift);
    segs.push([a, pt(a.x + (b.x - a.x) / 3, top), pt(a.x + ((b.x - a.x) * 2) / 3, top), b]);
  };
  hopTo(start, first, hop * 1.5);
  const at: number[] = [];
  let prev = first;
  order.forEach((box, k) => {
    const here = above(box);
    if (k > 0) hopTo(prev, here, hop);
    at[k] = segs.length;
    if (k === 4) {
      // The waggle dance: a figure of eight over the middle flower.
      segs.push([here, pt(here.x - 1.6 * wag, here.y - 1.2 * wag), pt(here.x - 1.6 * wag, here.y + 1.2 * wag), here]);
      segs.push([here, pt(here.x + 1.6 * wag, here.y - 1.2 * wag), pt(here.x + 1.6 * wag, here.y + 1.2 * wag), here]);
    }
    prev = here;
  });
  if (mode === "pane") {
    // Over to the strip beside the board, then up it past the hanging branch: clear of the
    // board and of the controls over the flowers.
    const lane = pt(branch.box.x + branch.box.width / 2, prev.y - 16);
    hopTo(prev, lane, hop);
    segs.push([lane, pt(lane.x + 8, lane.y - 50), pt(lane.x - 8, 30), pt(lane.x, -40)]);
  } else hopTo(prev, end, hop * 2);
  const lens = lengths(segs);
  const total = lens.reduce((a, b) => a + b, 0);
  const visits: number[] = Array(9).fill(0);
  order.forEach((box, k) => {
    visits[box] = lens.slice(0, at[k]).reduce((a, b) => a + b, 0) / total;
  });
  return { d: pathOf(segs), segs, visits, size };
}

/**
 * The swallow's swoop, always on its way right (it flies nose first). On a wide screen, in low from
 * the left past the tree, up and away; upright, in low from the left under the corner branch,
 * along the gap over the board, then up between the title and the home button and off the top; on
 * a phone on its side, up the strip beside the board under the hanging branch, then right across
 * the band over the flowers and away.
 */
function swallowFlight({ shell, bar, title, gapA, pad }: Pieces, mode: Mode, branch: Branch): Garden["swallow"] {
  const W = shell.width;
  const H = shell.height;
  let pts: Pt[];
  if (mode === "plot") pts = [pt(-50, H * 0.2), pt(W * 0.16, H * 0.3), pt(W * 0.42, H * 0.1), pt(W * 0.7, H * 0.16), pt(W + 50, H * 0.03)];
  else if (mode === "pane") {
    const x = branch.box.x + branch.box.width / 2;
    const top = bar.y + bar.height;
    const band = pad.y - top;
    pts = [
      pt(x, H + 40),
      pt(x, Math.max(branch.box.y + branch.box.height + 24, H * 0.5)),
      pt(pad.x + pad.width * 0.3, top + band * 0.45),
      pt(pad.x + pad.width * 0.7, top + band * 0.3),
      pt(W + 40, top + band * 0.2),
    ];
  } else {
    const low = gapA.y + gapA.height / 2;
    const free = title.x + title.width;
    const rise = (free + bar.x + bar.width - 44) / 2;
    pts = [pt(-40, low + 2), pt(W * 0.22, low + 3), pt(free + 4, low), pt(rise, bar.y + bar.height * 0.45), pt(rise + 20, -40)];
  }
  const segs = through(pts);
  return { d: pathOf(segs), segs, size: mode === "plot" ? 44 : 34 };
}

/** The rainbow over the top of the board, its feet fading in the gutters (narrower where they would leave the screen). */
function rainbow({ board, shell }: Pieces): Garden["bow"] {
  const w = board.width;
  const cx = board.x + w / 2;
  const r = Math.min(w * 0.6, cx - 4, shell.width - cx - 4);
  return {
    cx,
    // Its crown just over the board's top edge.
    cy: board.y - w * 0.02 + r,
    r,
    band: w * 0.022,
  };
}
