// A route ready to race: its ribbon, its items, and the most glow a run on it can hold.

import { expandPlaces, type Placed } from "./items";
import type { RouteDef } from "./route";
import { BIG_SPARK, GLOW_START, SPARK } from "./rules";
import { compileTrack, type Track } from "./track";

export type Compiled = Placed & { def: RouteDef; track: Track; maxGlow: number };

export function compileRoute(def: RouteDef): Compiled {
  const track = compileTrack(def);
  const placed = expandPlaces(def, track);
  const maxGlow = placed.items.reduce((sum, it) => sum + (it.kind === "spark" ? SPARK : it.kind === "big" ? BIG_SPARK : 0), GLOW_START);
  return { def, track, ...placed, maxGlow };
}
