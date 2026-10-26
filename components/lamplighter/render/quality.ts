// The quality governor: watches how long frames take and steps the drawing down (fewer pixels,
// a shorter view, fewer particles) when a phone can't keep up, and back up when it can. The
// simulation runs on its own fixed tick, so a lower tier never changes the game, only its looks.

export type Tier = {
  /** Device pixels per CSS pixel, at most (never above the screen's own). */
  dpr: number;
  /** How far ahead the ribbon is drawn (m). */
  far: number;
  /** Ribbon cross-sections every this many metres. */
  step: number;
  particles: number;
  twinkle: boolean;
};

export const TIERS: readonly Tier[] = [
  { dpr: 2, far: 140, step: 1, particles: 160, twinkle: true },
  { dpr: 1.5, far: 120, step: 1.5, particles: 120, twinkle: true },
  { dpr: 1.25, far: 100, step: 2, particles: 80, twinkle: false },
  { dpr: 1, far: 80, step: 2, particles: 40, twinkle: false },
];

/** Frames slower than this (ms, smoothed) for SLOW_RUN in a row step down… */
const SLOW_MS = 19;
const SLOW_RUN = 45;
/** …and faster than this for FAST_RUN in a row step back up. */
const FAST_MS = 14;
const FAST_RUN = 360;
/** A tier dropped from this many times is not tried again this session. */
const MAX_DROPS = 2;
/** Low Power Mode holds the screen to 30 a second: a steady cadence in this band is that, not trouble. */
const CAP_LOW = 31;
const CAP_HIGH = 35.5;
const CAP_SLOW_MS = 36;
/** Long enough to tell a cap from a stutter, short enough to call it before the first step down. */
const CAP_WINDOW = 40;
/** A gap this long is the page coming back from hidden, not a slow frame. */
const IGNORE_MS = 250;

export type Governor = {
  tier: number;
  ema: number;
  slow: number;
  fast: number;
  drops: number[];
  capped: boolean;
  recent: Float64Array;
  seen: number;
};

export function createGovernor(tier = 0): Governor {
  return { tier, ema: 0, slow: 0, fast: 0, drops: TIERS.map(() => 0), capped: false, recent: new Float64Array(CAP_WINDOW), seen: 0 };
}

/** Whether the last CAP_WINDOW frames all came at the 30-a-second cadence, and evenly. */
function steadyAt30(g: Governor): boolean {
  if (g.seen < CAP_WINDOW) return false;
  let sum = 0;
  for (const v of g.recent) {
    if (v < CAP_LOW || v > CAP_HIGH) return false;
    sum += v;
  }
  const mean = sum / CAP_WINDOW;
  let sq = 0;
  for (const v of g.recent) sq += (v - mean) * (v - mean);
  return Math.sqrt(sq / CAP_WINDOW) < 2;
}

/** Feeds one frame's interval (ms); returns the tier to draw at. */
export function feed(g: Governor, ms: number): number {
  if (!(ms > 0) || ms > IGNORE_MS) return g.tier;
  g.ema = g.ema === 0 ? ms : g.ema + 0.1 * (ms - g.ema);
  g.recent[g.seen % CAP_WINDOW] = ms;
  g.seen++;
  if (!g.capped && steadyAt30(g)) g.capped = true;
  else if (g.capped && g.ema < 25) g.capped = false;

  const slowMs = g.capped ? CAP_SLOW_MS : SLOW_MS;
  g.slow = g.ema > slowMs ? g.slow + 1 : 0;
  g.fast = !g.capped && g.ema < FAST_MS ? g.fast + 1 : 0;

  if (g.slow >= SLOW_RUN && g.tier < TIERS.length - 1) {
    g.drops[g.tier]++;
    g.tier++;
    g.slow = g.fast = 0;
  } else if (g.fast >= FAST_RUN && g.tier > 0 && g.drops[g.tier - 1] < MAX_DROPS) {
    g.tier--;
    g.slow = g.fast = 0;
  }
  return g.tier;
}
