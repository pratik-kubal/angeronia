// Players made of code, for the tests and the development autopilot: a skilled one that reads the
// route ahead, a casual one that reacts late and misses some hops, and one that never touches the
// controls. routes.test.ts sets par from the skilled one and checks that the others still finish,
// so every route stays fair. They see only what a player sees: the ribbon and what is on it.

import type { Compiled } from "./compiled";
import { clamp } from "./math";
import { mulberry32 } from "../random";
import { HAZARD_R, PICK_H, STEP, THREAD_H } from "./rules";
import { batAt, rainLanding, type Input, type Sim } from "./sim";
import { halfAt, solidAt } from "./track";

export type Bot = (sim: Sim, route: Compiled) => Input;

const IDLE: Input = { steer: 0, hop: false };
export const idleBot: Bot = () => IDLE;

/** How far ahead the skilled bot looks for something to steer toward (m). */
const LOOK = 16;

/** Whether a hazard will be where Wick is going to be, steering for `x`. */
function danger(sim: Sim, route: Compiled, x: number): boolean {
  const speed = Math.max(sim.vs, 4);
  for (let j = sim.cursor; j < route.items.length; j++) {
    const it = route.items[j];
    const ahead = it.s - sim.s;
    if (ahead > 9) break;
    if (ahead < -0.5) continue;
    const tick = sim.tick + Math.round(ahead / speed / STEP);
    if (it.kind === "rain") {
      for (let k = -4; k <= 4; k++) {
        if (rainLanding(it, tick + k) && Math.abs(it.x - x) < HAZARD_R + 0.5) return true;
      }
    } else if (it.kind === "bat" && tick >= it.c) {
      for (let k = -6; k <= 6; k += 3) {
        if (Math.abs(batAt(it, tick + k).x - x) < HAZARD_R + 0.6) return true;
      }
    }
  }
  return false;
}

/** The skilled bot: heads for the next spark, dodges what is coming, hops on time. */
export const skilledBot: Bot = (sim, route) => {
  if (sim.phase !== "running") return IDLE;
  const half = halfAt(route.track, sim.s);
  let target = 0;
  let hop = false;
  const speed = Math.max(sim.vs, 4);

  // The nearest pickup ahead that is still there and within reach of the steering.
  for (let j = sim.cursor; j < route.items.length; j++) {
    const it = route.items[j];
    const ahead = it.s - sim.s;
    if (ahead > LOOK) break;
    if (ahead < 0.3 || sim.taken[j]) continue;
    if (it.kind === "spark" || it.kind === "big" || it.kind === "blossom" || it.kind === "dew") {
      const reachable = Math.abs(it.x - sim.x) <= (ahead / speed) * 7 + 0.6;
      if (!reachable) continue;
      target = it.x;
      // A high spark: hop so the top of the hop meets it.
      if (it.h > PICK_H - 0.15 && !sim.air && ahead > 3.4 * (speed / 14) && ahead < 5 * (speed / 14)) hop = true;
      break;
    }
  }

  // Dodge: if the line toward the target crosses rain or a bat, take the clearer side.
  if (danger(sim, route, target)) {
    const left = clamp(target - 1.8, -half + 0.4, half - 0.4);
    const right = clamp(target + 1.8, -half + 0.4, half - 0.4);
    target = !danger(sim, route, right) ? right : !danger(sim, route, left) ? left : target;
  }
  target = clamp(target, -half + 0.4, half - 0.4);

  // Threads: hop so Wick is above them as it passes. Gaps: hop at the edge.
  for (let j = sim.cursor; j < route.items.length; j++) {
    const it = route.items[j];
    const ahead = it.s - sim.s;
    if (ahead > 6) break;
    if (it.kind === "thread" && ahead > 1.6 * (speed / 14) && ahead < 3.2 * (speed / 14) && Math.abs(it.x - sim.x) <= it.r) hop = true;
  }
  if (!sim.air && solidAt(route.track, sim.s)) {
    for (let d = 0.5; d <= 1.5; d += 0.5) if (!solidAt(route.track, sim.s + d)) hop = true;
  }
  if (!sim.air && !solidAt(route.track, sim.s)) hop = true;
  if (sim.air && sim.h < THREAD_H) hop = false;

  // A firm hand on the steering, allowing for the wind.
  const steer = clamp(1.4 * (target - sim.x) - 0.12 * (sim.vx + sim.gust) - 0.25 * sim.gust, -1, 1);
  return { steer, hop };
};

/**
 * A casual player: sees what the skilled bot sees a quarter of a second late, steers less
 * cleanly, and misses three hops in ten.
 */
export function casualBot(seed: number): Bot {
  const rng = mulberry32(seed);
  const LAG = 15;
  const queue: Input[] = [];
  let wasHop = false;
  let skipping = false;
  let wobble = 0;
  return (sim, route) => {
    const seen = skilledBot(sim, route);
    queue.push(seen);
    const late = queue.length > LAG ? queue.shift()! : IDLE;
    if (late.hop && !wasHop) skipping = rng() < 0.3;
    wasHop = late.hop;
    if (rng() < 0.05) wobble = (rng() * 2 - 1) * 0.35;
    return { steer: clamp(late.steer * 0.8 + wobble, -1, 1), hop: late.hop && !skipping };
  };
}
