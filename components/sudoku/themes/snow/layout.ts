import type { Anchor } from "../use-anchor";

// Where Snow Day's clothesline hangs: strung between the two round buttons, level with their
// middles by them and sagging under the title into the empty band over the board (on a phone on
// its side, over the free band above the pad). Box b's mitten hangs from peg b (reading order).
// Every number is in px from the bar's top-left.

/** A point on the wire, and the wire's slope there in degrees. */
export type Pin = { x: number; y: number; tilt: number };

export type Line = {
  path: string;
  /** The hooks at either end. */
  ends: readonly [Pin, Pin];
  /** One peg per box, in reading order. */
  pegs: Pin[];
  /** The fairy lights (lit at night): one before every peg and one after the last. */
  bulbs: Pin[];
  /** Where the chickadee lands when the board is solved (between two pegs, clear of the title), and its width. */
  perch: Pin & { size: number };
  mitten: { width: number; height: number };
  /** The lowest a mitten reaches. */
  bottom: number;
};

/** The hooks sit this far in from the bar's ends, just inside the round buttons. */
const HOOK = 50;
/** The hooks' height: the bar's middle. */
const TOP = 24;
const MAX_DEPTH = 36;
/** The title's box runs this far under its letters (the emblem's line box). */
const TITLE_SLACK = 4;
/** A mitten's peg rises this far over the wire, and the mitten hangs this far under it (in mitten widths). */
const PEG_UP = 0.3;
const DROP = 1.14;
/** How small a mitten may get on a short band over the board, and how flat the wire may run. */
const MIN_MITTEN = 10;
const MAX_FLAT = 16;
/** The chickadee is this many mitten widths across; it spans 0.45 of itself left of its perch and stands 0.68 tall over it. */
const BIRD = 1.45;
/** The perches, in steps from the left hook, best first: the old spot right of the middle, then outwards. */
const PERCHES = [7.5, 8.5, 6.5, 9.5, 5.5, 4.5, 3.5, 2.5, 1.5, 0.5];

const clamp = (lo: number, v: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * The line for this layout. `under` is what the line hangs over (the board, or on a phone on its
 * side the pad): no mitten reaches it. Under the title the wire runs low enough for the pegs to
 * clear its letters; where the band is too short for both, the mittens shrink, and where it is
 * shorter still, the board wins.
 */
export function clothesline(bar: Anchor, under: Anchor, title: Anchor): Line {
  const left = HOOK;
  const right = bar.width - HOOK;
  const mid = (left + right) / 2;
  const half = (right - left) / 2;
  const step = (right - left) / 10;
  const xs = Array.from({ length: 9 }, (_, k) => left + (k + 1) * step);

  const floor = under.y - bar.y;
  const words = { left: title.x - bar.x, right: title.x + title.width - bar.x, bottom: title.y + title.height - bar.y - TITLE_SLACK };
  const width = Math.max(MIN_MITTEN, Math.min(clamp(12, step * 0.56, 18), (floor - words.bottom - 6) / (PEG_UP + DROP)));
  const height = width * 1.3;

  // 1 − |u|^p: level at the hooks, deepest in the middle, as deep as the band allows. A wide title
  // (or a short band) flattens it, so the wire is already low enough where the title's edges are.
  const depth = Math.max(4, Math.min(MAX_DEPTH, floor - DROP * width - 4 - TOP));
  const need = (words.bottom + PEG_UP * width + 1.5 - TOP) / depth;
  const edge = Math.max(Math.abs(words.left - width / 2 - 2 - mid), Math.abs(words.right + width / 2 + 2 - mid)) / half;
  const flat = need >= 1 || edge >= 1 ? MAX_FLAT : need <= 0 ? 2 : clamp(2, Math.log(1 - need) / Math.log(edge), MAX_FLAT);
  const sag = (x: number) => 1 - Math.abs(clamp(-1, (x - mid) / half, 1)) ** flat;

  const y = (x: number) => TOP + depth * sag(x);
  const pin = (x: number): Pin => ({ x, y: y(x), tilt: (Math.atan((y(x + 1) - y(x - 1)) / 2) * 180) / Math.PI });
  const points: string[] = [];
  for (let x = left; x < right; x += 2) points.push(`${x.toFixed(1)} ${y(x).toFixed(1)}`);
  points.push(`${right.toFixed(1)} ${TOP}`);

  return {
    path: `M${points.join(" L")}`,
    ends: [pin(left), pin(right)],
    pegs: xs.map(pin),
    bulbs: Array.from({ length: 10 }, (_, k) => pin(left + (k + 0.5) * step)),
    perch: perch(left, step, bar.width, words, pin, width * BIRD),
    mitten: { width, height },
    bottom: Math.max(...xs.map((x) => y(x) + DROP * width)),
  };
}

/**
 * The chickadee's perch: the first spot between two pegs where it lands whole, clear of the title
 * and the round buttons; failing that (a long title on a narrow phone), the spot with the most room,
 * where it lands smaller.
 */
function perch(left: number, step: number, barWidth: number, words: { left: number; right: number; bottom: number }, pin: (x: number) => Pin, full: number) {
  let best = { at: pin(left + PERCHES[0] * step), size: 0 };
  for (const k of PERCHES) {
    const at = pin(left + k * step);
    // Clear of the title: right of it, left of it, or under its letters.
    const clear = Math.max((at.x - words.right - 1) / 0.45, (words.left - 1 - at.x) / 0.55, (at.y - words.bottom) / 0.68);
    // Clear of the round buttons (44px at each end).
    const room = Math.min((at.x - 46) / 0.45, (barWidth - 46 - at.x) / 0.55);
    const size = Math.min(full, clear, room);
    if (size >= full) return { ...at, size };
    if (size > best.size) best = { at, size };
  }
  return { ...best.at, size: Math.max(best.size, MIN_MITTEN) };
}
