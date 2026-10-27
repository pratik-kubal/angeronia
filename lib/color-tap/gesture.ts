// Tells Color Tap's taps from its pans and pinches. The stage's pointer listeners feed it every
// down, move, up and cancel, with the time; it answers with what the view should do. A pointer
// that never strays past its slop and lifts is a tap, however long it was held, at the point it
// went down (so a finger that rolls as it lifts still paints the area it chose). One that strays
// past it pans, a second finger makes it a pinch, and letting go hands back the release velocity
// for a glide. Nothing here touches the DOM, so the tests drive it with plain numbers.

import type { Point } from "./camera";

export type PointerKind = "touch" | "pen" | "mouse";

export type GestureEvent =
  /** The view starts moving: the first move past the slop, or a second finger down. */
  | { type: "start" }
  /** CSS px since the last event. */
  | { type: "pan"; dx: number; dy: number }
  /** Apply as: pan by (dx, dy), then zoom by `factor` about `at`, the fingers' new midpoint. */
  | { type: "pinch"; factor: number; at: Point; dx: number; dy: number }
  /** One pointer, never past its slop, released: at its down position. */
  | { type: "tap"; x: number; y: number; kind: PointerKind }
  /** The last pointer of a moving gesture lifted, at this velocity in CSS px per ms. */
  | { type: "end"; vx: number; vy: number };

/** How far (CSS px) a pointer may stray and still tap: a fingertip rolls, a mouse barely moves. */
export const SLOP: Readonly<Record<PointerKind, number>> = { touch: 10, pen: 10, mouse: 4 };
/** The release velocity is the movement over this many ms before the last move… */
const VELOCITY_WINDOW = 60;
/** …and nothing if the pointer was still for longer than this before it lifted. */
const STILL = 60;

interface Pointer {
  kind: PointerKind;
  /** Where it went down. */
  x0: number;
  y0: number;
  /** Where it was at its last event. */
  x: number;
  y: number;
}

interface Sample {
  t: number;
  x: number;
  y: number;
}

/** One gesture classifier per stage. A gesture runs from the first pointer down to the last up. */
export class Gestures {
  private readonly pointers = new Map<number, Pointer>();
  /** The view is moving: past the slop, or pinched. Such a gesture never taps. */
  private moving = false;
  /** A second finger came down at some point: the gesture ends without a glide. */
  private pinched = false;
  /** The lone pointer's positions on each move, oldest first, trimmed to the velocity window. */
  private samples: Sample[] = [];

  /** Pointers down. */
  get active(): number {
    return this.pointers.size;
  }

  down(id: number, x: number, y: number, t: number, kind: PointerKind): GestureEvent[] {
    // A pointer that goes down while it is still down here lost its up on the way (a mouse is
    // always the same pointer). What it was doing is over, as if it had been cancelled, and this
    // is a fresh press, not a move from where the old one went down.
    const lost = this.pointers.has(id) ? this.cancel(id) : [];
    // A third finger is ignored, all the way to its up.
    if (this.pointers.size >= 2) return lost;
    this.pointers.set(id, { kind, x0: x, y0: y, x, y });
    if (this.pointers.size === 1) {
      this.moving = false;
      this.pinched = false;
      this.samples = [{ t, x, y }];
      return lost;
    }
    this.pinched = true;
    if (this.moving) return [];
    this.moving = true;
    return [{ type: "start" }];
  }

  move(id: number, x: number, y: number, t: number): GestureEvent[] {
    const p = this.pointers.get(id);
    if (!p || (p.x === x && p.y === y)) return [];
    if (this.pointers.size === 2) return this.pinch(p, x, y);
    const dx = x - p.x;
    const dy = y - p.y;
    p.x = x;
    p.y = y;
    this.sample(t, x, y);
    if (this.moving) return [{ type: "pan", dx, dy }];
    if (Math.hypot(x - p.x0, y - p.y0) <= SLOP[p.kind]) return [];
    // Past the slop: the view catches up with everything since the pointer went down, so the
    // picture is under the finger again where it was when it was touched.
    this.moving = true;
    return [{ type: "start" }, { type: "pan", dx: x - p.x0, dy: y - p.y0 }];
  }

  up(id: number, x: number, y: number, t: number): GestureEvent[] {
    const p = this.pointers.get(id);
    if (!p) return [];
    // Where it lifted counts as its last move, in case no move reported it.
    const events = this.move(id, x, y, t);
    this.pointers.delete(id);
    // One of two fingers lifted: the other pans on from where it is now, which is where its next
    // move is measured from, so the view doesn't jump.
    if (this.pointers.size > 0) return events;
    if (!this.moving) return [...events, { type: "tap", x: p.x0, y: p.y0, kind: p.kind }];
    const v = this.pinched ? { vx: 0, vy: 0 } : this.velocity(t);
    this.moving = false;
    return [...events, { type: "end", ...v }];
  }

  /** The browser took the pointer (pointercancel): never a tap, and the whole gesture ends. */
  cancel(id: number): GestureEvent[] {
    if (!this.pointers.has(id)) return [];
    this.pointers.clear();
    if (!this.moving) return [];
    this.moving = false;
    return [{ type: "end", vx: 0, vy: 0 }];
  }

  /** One of two fingers moved: the midpoint pans, and the gap between them zooms. */
  private pinch(p: Pointer, x: number, y: number): GestureEvent[] {
    const [a, b] = [...this.pointers.values()];
    const before = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, gap: Math.hypot(a.x - b.x, a.y - b.y) };
    p.x = x;
    p.y = y;
    const at = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    const gap = Math.hypot(a.x - b.x, a.y - b.y);
    // Two fingers on one spot have no gap to measure a zoom by.
    const factor = before.gap > 0 && gap > 0 ? gap / before.gap : 1;
    return [{ type: "pinch", factor, at, dx: at.x - before.x, dy: at.y - before.y }];
  }

  private sample(t: number, x: number, y: number) {
    this.samples.push({ t, x, y });
    // Keep the newest sample from before the window too: the window may start between it and the next.
    while (this.samples.length > 2 && this.samples[1].t <= t - VELOCITY_WINDOW) this.samples.shift();
  }

  /**
   * The lone pointer's velocity over the last 60 ms of its movement, or over all of it if it moved
   * for less; nothing if it was still for more than 60 ms before it lifted at `t`.
   */
  private velocity(t: number): { vx: number; vy: number } {
    const last = this.samples[this.samples.length - 1];
    if (this.samples.length < 2 || t - last.t > STILL) return { vx: 0, vy: 0 };
    const from = last.t - VELOCITY_WINDOW;
    let i = this.samples.length - 2;
    while (i > 0 && this.samples[i].t > from) i--;
    const a = this.samples[i];
    const b = this.samples[i + 1];
    let start: Sample = a;
    if (a.t < from) {
      // The window opens between two moves: where the pointer was then, at a steady speed between them.
      const f = (from - a.t) / (b.t - a.t);
      start = { t: from, x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
    }
    const dt = last.t - start.t;
    if (!(dt > 0)) return { vx: 0, vy: 0 };
    return { vx: (last.x - start.x) / dt, vy: (last.y - start.y) / dt };
  }
}

/** Where a released pan has glided to: the total displacement since release, CSS px. */
export interface Glide {
  at(ms: number): { dx: number; dy: number; done: boolean };
}

/** The glide's time constant, ms: iOS's scroll deceleration, near enough. */
const TAU = 325;
/** Slower than this (CSS px per ms) a release is a stop, not a flick. */
const SLOWEST_FLICK = 0.3;
/** Faster flicks glide as if they were this fast, so one can't throw the picture away. */
const FASTEST_FLICK = 1.4;
/** The glide ends once it is slower than this. */
const STOPPED = 0.02;

/**
 * The inertia after a pan: d(t) = v·τ·(1 − e^(−t/τ)), τ = 325 ms, which starts at the release
 * velocity and slows exponentially. None for a release slower than 0.3 px/ms; the speed is capped
 * at 1.4 px/ms; done once it has slowed below 0.02 px/ms, where it stays.
 */
export function glide(vx: number, vy: number): Glide | null {
  const speed = Math.hypot(vx, vy);
  if (!(speed >= SLOWEST_FLICK)) return null;
  const k = Math.min(speed, FASTEST_FLICK) / speed;
  const ux = vx * k;
  const uy = vy * k;
  const end = TAU * Math.log((speed * k) / STOPPED);
  return {
    at(ms) {
      const t = Math.min(Math.max(ms, 0), end);
      const travelled = TAU * (1 - Math.exp(-t / TAU));
      return { dx: ux * travelled, dy: uy * travelled, done: t >= end };
    },
  };
}
