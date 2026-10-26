// A route's placements, expanded into the things Wick meets: every spark of a line, every
// raindrop's spot, every thread and bat, sorted along the ribbon with stable ids (the simulation's
// "taken" flags and a recorded run both count on them).

import { lerp } from "./math";
import { HAZARD_R, PICK_R, THREAD_H, TICK_HZ } from "./rules";
import type { Place, RouteDef, SayId } from "./route";
import type { Track } from "./track";
import { halfAt } from "./track";

export type ItemKind = "spark" | "big" | "blossom" | "dew" | "rain" | "thread" | "bat";

/**
 * One thing on the ribbon at (s, x, h). `r` is its reach (a thread's half span). The rest depend
 * on the kind: rain `a` = ticks between drops, `b` = first drop's tick; bat `a` = swing (m),
 * `b` = ticks per swoop, `c` = first swoop's tick.
 */
export type Item = { id: number; kind: ItemKind; s: number; x: number; h: number; r: number; a: number; b: number; c: number };

/** A stretch of wind. */
export type Zone = { s: number; end: number; push: number };
export type Say = { s: number; line: SayId };

export type Placed = { items: Item[]; zones: Zone[]; lamps: number[]; says: Say[] };

const item = (kind: ItemKind, s: number, x: number, h: number, r: number, a = 0, b = 0, c = 0) => ({ id: 0, kind, s, x, h, r, a, b, c });

/** Spark heights: a line sits at ribbon height; an arc bows up by `arc` at its middle. */
function sparks(p: Extract<Place, { kind: "sparks" }>): Item[] {
  const out: Item[] = [];
  const every = p.every ?? 2;
  for (let k = 0; k < p.n; k++) {
    const u = p.n > 1 ? k / (p.n - 1) : 0;
    const x = lerp(p.x ?? 0, p.to ?? p.x ?? 0, u);
    const h = p.arc ? p.arc * 4 * u * (1 - u) : 0;
    out.push(item(p.big ? "big" : "spark", p.s + k * every, x, h, PICK_R));
  }
  return out;
}

export function expandPlaces(def: Pick<RouteDef, "places">, track: Track): Placed {
  const items: Item[] = [];
  const zones: Zone[] = [];
  const lamps: number[] = [];
  const says: Say[] = [];
  for (const p of def.places) {
    switch (p.kind) {
      case "sparks":
        items.push(...sparks(p));
        break;
      case "blossom":
      case "dew":
        items.push(item(p.kind, p.s, p.x, 0, PICK_R));
        break;
      case "rain":
        items.push(item("rain", p.s, p.x, 0, HAZARD_R, Math.round(p.every * TICK_HZ), Math.round((p.at ?? 0) * TICK_HZ)));
        break;
      case "thread": {
        const half = halfAt(track, p.s);
        const from = p.from ?? -half - 1;
        const to = p.to ?? half + 1;
        items.push(item("thread", p.s, (from + to) / 2, THREAD_H, (to - from) / 2));
        break;
      }
      case "bat":
        items.push(item("bat", p.s, p.x, 0, HAZARD_R, p.swing, Math.round(p.every * TICK_HZ), Math.round((p.at ?? 0) * TICK_HZ)));
        break;
      case "gust":
        zones.push({ s: p.s, end: p.s + p.len, push: p.push });
        break;
      case "lamp":
        lamps.push(p.s);
        break;
      case "say":
        says.push({ s: p.s, line: p.line });
        break;
    }
  }
  // Array sort is stable, so items at the same spot keep the order they were authored in.
  items.sort((a, b) => a.s - b.s);
  items.forEach((it, i) => (it.id = i));
  zones.sort((a, b) => a.s - b.s);
  lamps.sort((a, b) => a - b);
  says.sort((a, b) => a.s - b.s);
  return { items, zones, lamps, says };
}
