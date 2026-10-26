// Lamplighter's rules, in numbers. Our own tuning: Wick cruises at 14 m/s, a hop clears any gap
// at that speed, and nothing ever ends a run; a mistake costs a little time or a little glow.

/** The simulation's tick: 60 a second, whatever the screen draws at. */
export const TICK_HZ = 60;
export const STEP = 1 / TICK_HZ;
/** Stamped on every recorded run; bump when a rule below changes, since old runs replay differently. */
export const SIM_VERSION = 1;

/** Ticks of countdown before Go. */
export const COUNTDOWN = 180;

// ── Speed (m/s, m/s²) ────────────────────────────────────────────────────────
export const CRUISE = 14;
/** A blossom's tailwind adds this much, for TAIL_TICKS, easing out over the last TAIL_FADE. */
export const TAILWIND = 7;
export const TAIL_TICKS = 108;
export const TAIL_FADE = 36;
/** Out of the current (off the ribbon's edge). */
export const SLOW_OFF = 6;
/** Carried across a gap by the moths. */
export const DIP_SPEED = 6;
export const ACCEL = 16;
export const DECEL = 20;

// ── Steering (m, m/s, m/s²) ──────────────────────────────────────────────────
export const LAT_MAX = 7;
export const LAT_ACC = 45;
/** How far past the edge Wick may be before leaving the current, and the furthest the drift goes. */
export const EDGE_SLACK = 0.4;
export const OFF_MAX = 2.5;
/** Out of the current, a drift back toward the ribbon (m/s). */
export const OFF_PULL = 2.5;
/** A gust's push builds up to this much sideways speed at most. */
export const GUST_MAX = 3;
/** Out of a gust, its push fades at this rate. */
export const GUST_FADE = 6;

// ── Hop (m/s, m/s², ticks) ───────────────────────────────────────────────────
export const HOP_V = 6.5;
export const GRAVITY = 20;
/** Ticks Wick may still hop after the ribbon runs out underfoot. */
export const COYOTE = 5;
/** How deep the moths carry Wick under a gap, and how fast it sinks and rises (m, m/s). */
export const DIP_DEPTH = 1;
export const DIP_RATE = 3;

// ── Touching things (m, ticks) ───────────────────────────────────────────────
/** A spark is gathered within this distance along and across the ribbon… */
export const PICK_R = 0.9;
/** …and within this much height: a hop gathers the high arcs and skips the low ones. */
export const PICK_H = 0.75;
export const HAZARD_R = 0.8;
/** A thread is strung this high: hop over it, or stick. */
export const THREAD_H = 0.55;
export const STUCK_TICKS = 30;
/** A raindrop lands for this many ticks of each fall. */
export const RAIN_TICKS = 7;
/** After a hit, nothing hits again for this long. */
export const SAFE_TICKS = 45;

// ── Glow ─────────────────────────────────────────────────────────────────────
export const GLOW_START = 10;
export const GLOW_MAX = 999;
export const SPARK = 1;
export const BIG_SPARK = 3;
export const HIT = 8;
export const DIP = 5;

/** The finish line sits this far before the end of the ribbon, under the lantern. */
export const FINISH_BEFORE = 5;
