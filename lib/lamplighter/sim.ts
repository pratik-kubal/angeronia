// The race, one tick at a time. Pure and deterministic: the same route and the same inputs give
// the same run in any engine, which a recorded run (replay.ts) and the tests both depend on. A
// tick uses only arithmetic, comparisons and tables: no Math.sin, no randomness, no clock.
//
// Wick lives in track coordinates: `s` along the ribbon, `x` to the right of its centre line, `h`
// above it. Nothing ends a run. Off the edge Wick slows and drifts back; into a gap, the moths
// carry Wick across; a thread holds Wick for half a second; a hit costs glow.

import type { Compiled } from "./compiled";
import { clamp, tsin } from "./math";
import {
  ACCEL,
  BIG_SPARK,
  COUNTDOWN,
  COYOTE,
  CRUISE,
  DECEL,
  DIP,
  DIP_DEPTH,
  DIP_RATE,
  DIP_SPEED,
  EDGE_SLACK,
  FINISH_BEFORE,
  GLOW_MAX,
  GLOW_START,
  GRAVITY,
  GUST_FADE,
  GUST_MAX,
  HIT,
  HOP_V,
  LAT_ACC,
  LAT_MAX,
  OFF_MAX,
  OFF_PULL,
  PICK_H,
  PICK_R,
  RAIN_TICKS,
  SAFE_TICKS,
  SLOW_OFF,
  SPARK,
  STEP,
  STUCK_TICKS,
  TAIL_FADE,
  TAIL_TICKS,
  TAILWIND,
  THREAD_H,
} from "./rules";
import { halfAt, solidAt } from "./track";

/** One tick's controls: steer −1 (left) … 1 (right), and whether hop was pressed since the last tick. */
export type Input = { steer: number; hop: boolean };

export type EventKind =
  | "go"
  | "spark"
  | "blossom"
  | "dew"
  | "hit"
  | "shielded"
  | "hop"
  | "land"
  | "off"
  | "back"
  | "stuck"
  | "freed"
  | "dip"
  | "lamp"
  | "finish";

/** Something that happened this tick; `item` is the item's id (a lamp's index for "lamp"), or −1. */
export type SimEvent = { kind: EventKind; item: number };

export type Phase = "countdown" | "running" | "finished";

export type Sim = {
  tick: number;
  phase: Phase;
  s: number;
  x: number;
  h: number;
  vs: number;
  vx: number;
  vh: number;
  /** Sideways speed from the wind. */
  gust: number;
  air: boolean;
  /** Being carried across a gap. */
  dip: boolean;
  /** Out of the current, past the ribbon's edge. */
  off: boolean;
  /** Ticks left to hop after the ribbon ran out underfoot. */
  coyote: number;
  /** Ticks left held by a thread. */
  stuck: number;
  /** Ticks left of a blossom's tailwind. */
  tail: number;
  /** Ticks left before anything can hit again. */
  safe: number;
  shield: boolean;
  glow: number;
  sparks: number;
  hits: number;
  dips: number;
  /** The last way-lamp lit (its index), or −1. */
  lamp: number;
  finishTick: number;
  /** 1 for each item gathered or used up. */
  taken: Uint8Array;
  cursor: number;
  zone: number;
  nextLamp: number;
  events: SimEvent[];
};

/** Steering in 1/63 steps: what a recorded run stores, so a live run and its replay see the same number. */
export const quantizeSteer = (v: number) => Math.round(clamp(v, -1, 1) * 63) / 63;

export function createSim(route: Compiled): Sim {
  return {
    tick: 0,
    phase: "countdown",
    s: 0,
    x: 0,
    h: 0,
    vs: 0,
    vx: 0,
    vh: 0,
    gust: 0,
    air: false,
    dip: false,
    off: false,
    coyote: COYOTE,
    stuck: 0,
    tail: 0,
    safe: 0,
    shield: false,
    glow: GLOW_START,
    sparks: 0,
    hits: 0,
    dips: 0,
    lamp: -1,
    finishTick: -1,
    taken: new Uint8Array(route.items.length),
    cursor: 0,
    zone: 0,
    nextLamp: 0,
    events: [],
  };
}

/** Seconds of racing (from Go), or, once finished, the run's time. */
export const raceTicks = (sim: Sim) => Math.max(0, (sim.phase === "finished" ? sim.finishTick : sim.tick) - COUNTDOWN);

const approach = (v: number, target: number, up: number, down: number) =>
  v < target ? Math.min(target, v + up * STEP) : Math.max(target, v - down * STEP);

const emit = (sim: Sim, kind: EventKind, item = -1) => sim.events.push({ kind, item });

function hit(sim: Sim, item: number) {
  if (sim.safe > 0) return;
  sim.safe = SAFE_TICKS;
  if (sim.shield) {
    sim.shield = false;
    emit(sim, "shielded", item);
    return;
  }
  sim.glow = Math.max(0, sim.glow - HIT);
  sim.hits++;
  emit(sim, "hit", item);
}

function startDip(sim: Sim) {
  sim.dip = true;
  sim.air = false;
  sim.vh = 0;
  sim.glow = Math.max(0, sim.glow - DIP);
  sim.dips++;
  emit(sim, "dip");
}

/** A bat's place `tick` ticks in: it swings across its spot and bobs. */
export function batAt(item: { x: number; a: number; b: number; c: number }, tick: number): { x: number; h: number } {
  const turns = (tick - item.c) / item.b;
  return { x: item.x + item.a * tsin(turns), h: 0.7 + 0.4 * tsin(turns * 2 + 0.25) };
}

/** Whether a raindrop is landing at `tick`. */
export const rainLanding = (item: { a: number; b: number }, tick: number) => tick >= item.b && (tick - item.b) % item.a < RAIN_TICKS;

export function step(sim: Sim, input: Input, route: Compiled): void {
  sim.events.length = 0;
  if (sim.phase === "finished") return;
  sim.tick++;
  if (sim.phase === "countdown") {
    if (sim.tick >= COUNTDOWN) {
      sim.phase = "running";
      emit(sim, "go");
    }
    return;
  }

  const track = route.track;
  const steer = quantizeSteer(input.steer);
  const prevS = sim.s;
  if (sim.safe > 0) sim.safe--;
  if (sim.tail > 0) sim.tail--;

  // Forward.
  if (sim.stuck > 0) {
    sim.stuck--;
    sim.vs = 0;
    if (sim.stuck === 0) emit(sim, "freed");
  } else {
    const boost = sim.tail > TAIL_FADE ? TAILWIND : (TAILWIND * sim.tail) / TAIL_FADE;
    const target = sim.dip ? DIP_SPEED : sim.off ? SLOW_OFF : CRUISE + boost;
    sim.vs = approach(sim.vs, target, ACCEL, DECEL);
  }

  // Sideways: steering, the wind, and the drift back when out of the current.
  sim.vx = approach(sim.vx, steer * LAT_MAX, LAT_ACC, LAT_ACC);
  const zones = route.zones;
  while (sim.zone < zones.length && zones[sim.zone].end <= sim.s) sim.zone++;
  const zone = zones[sim.zone];
  if (zone && sim.s >= zone.s) sim.gust = clamp(sim.gust + zone.push * STEP, -GUST_MAX, GUST_MAX);
  else sim.gust = approach(sim.gust, 0, GUST_FADE, GUST_FADE);
  const pull = sim.off ? -Math.sign(sim.x) * OFF_PULL : 0;
  sim.x += (sim.vx + sim.gust + pull) * STEP;
  sim.s += sim.vs * STEP;

  const half = halfAt(track, sim.s);
  const limit = half + OFF_MAX;
  if (sim.x > limit) sim.x = limit;
  else if (sim.x < -limit) sim.x = -limit;
  const abs = Math.abs(sim.x);
  if (!sim.off && abs > half + EDGE_SLACK) {
    sim.off = true;
    emit(sim, "off");
  } else if (sim.off && abs <= half) {
    sim.off = false;
    emit(sim, "back");
  }

  // Up and down: hop, fall, the moths' carry under a gap.
  const solid = solidAt(track, sim.s);
  if (input.hop && !sim.air && !sim.dip && sim.stuck === 0 && sim.coyote > 0) {
    sim.air = true;
    sim.vh = HOP_V;
    emit(sim, "hop");
  }
  if (sim.air) {
    sim.vh -= GRAVITY * STEP;
    sim.h += sim.vh * STEP;
    if (sim.h <= 0) {
      if (solid) {
        sim.h = 0;
        sim.vh = 0;
        sim.air = false;
        sim.coyote = COYOTE;
        emit(sim, "land");
      } else startDip(sim);
    }
  } else if (sim.dip) {
    if (solid) {
      sim.h = Math.min(0, sim.h + DIP_RATE * STEP);
      if (sim.h === 0) {
        sim.dip = false;
        sim.coyote = COYOTE;
        emit(sim, "land");
      }
    } else sim.h = Math.max(-DIP_DEPTH, sim.h - DIP_RATE * STEP);
  } else if (solid) sim.coyote = COYOTE;
  else if (--sim.coyote <= 0) startDip(sim);

  // What Wick meets, within a metre and a half either way.
  const items = route.items;
  const from = Math.min(prevS, sim.s) - 1.5;
  while (sim.cursor < items.length && items[sim.cursor].s < from) sim.cursor++;
  for (let j = sim.cursor; j < items.length && items[j].s <= sim.s + 1.5; j++) {
    if (sim.taken[j]) continue;
    const it = items[j];
    const ds = it.s - sim.s;
    const dx = it.x - sim.x;
    switch (it.kind) {
      case "spark":
      case "big":
      case "blossom":
      case "dew":
        if (sim.dip || ds * ds + dx * dx > PICK_R * PICK_R || Math.abs(sim.h - it.h) > PICK_H) break;
        sim.taken[j] = 1;
        if (it.kind === "blossom") {
          sim.tail = TAIL_TICKS;
          emit(sim, "blossom", j);
        } else if (it.kind === "dew") {
          sim.shield = true;
          emit(sim, "dew", j);
        } else {
          sim.sparks++;
          sim.glow = Math.min(GLOW_MAX, sim.glow + (it.kind === "big" ? BIG_SPARK : SPARK));
          emit(sim, "spark", j);
        }
        break;
      case "thread":
        // Swept, so no speed can slip through it.
        if (prevS < it.s && it.s <= sim.s && Math.abs(dx) <= it.r && sim.h < THREAD_H && !sim.dip) {
          sim.taken[j] = 1;
          sim.stuck = STUCK_TICKS;
          sim.vs = 0;
          sim.s = it.s;
          emit(sim, "stuck", j);
        }
        break;
      case "rain":
        if (rainLanding(it, sim.tick) && Math.abs(ds) <= it.r && Math.abs(dx) <= it.r && sim.h < 1.5) hit(sim, j);
        break;
      case "bat": {
        if (sim.tick < it.c) break;
        const bat = batAt(it, sim.tick);
        const bx = bat.x - sim.x;
        const bh = bat.h - sim.h;
        if (ds * ds + bx * bx + bh * bh <= it.r * it.r) hit(sim, j);
        break;
      }
    }
  }

  while (sim.nextLamp < route.lamps.length && route.lamps[sim.nextLamp] <= sim.s) {
    sim.lamp = sim.nextLamp++;
    emit(sim, "lamp", sim.lamp);
  }

  if (sim.s >= track.length - FINISH_BEFORE) {
    sim.s = track.length - FINISH_BEFORE;
    sim.phase = "finished";
    sim.finishTick = sim.tick;
    emit(sim, "finish");
  }
}

/** A copy to come back to: "Retry from the last lamp". */
export function snapshot(sim: Sim): Sim {
  return { ...sim, taken: sim.taken.slice(), events: [] };
}

export function restore(into: Sim, snap: Sim): void {
  const taken = into.taken;
  Object.assign(into, snap, { taken, events: [] });
  taken.set(snap.taken);
}

/** A fingerprint of everything that matters in a run: equal runs hash equal. */
export function hashSim(sim: Sim): string {
  const parts = [
    sim.tick,
    sim.phase,
    sim.s,
    sim.x,
    sim.h,
    sim.vs,
    sim.vx,
    sim.vh,
    sim.gust,
    sim.air,
    sim.dip,
    sim.off,
    sim.coyote,
    sim.stuck,
    sim.tail,
    sim.safe,
    sim.shield,
    sim.glow,
    sim.sparks,
    sim.hits,
    sim.dips,
    sim.lamp,
    sim.finishTick,
    Array.from(sim.taken).join(""),
  ].join("|");
  let h = 0x811c9dc5;
  for (let i = 0; i < parts.length; i++) {
    h ^= parts.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}
