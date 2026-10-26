// Flames: what a run earns on its route, kept across runs. One for reaching the lantern, one for
// arriving with the glow the route asks for, one for beating par. They add up on the route map,
// where each lights a window in the town, and the totals open the routes in turn.

import type { RouteDef, RouteId } from "./route";
import { STEP } from "./rules";
import { raceTicks, type Sim } from "./sim";

export const FLAME_FINISH = 1;
export const FLAME_GLOW = 2;
export const FLAME_PAR = 4;
export const ALL_FLAMES = FLAME_FINISH | FLAME_GLOW | FLAME_PAR;

/** The flames a finished run earned (none if it didn't finish). */
export function flamesFor(def: Pick<RouteDef, "glowGoal" | "par">, sim: Sim): number {
  if (sim.phase !== "finished") return 0;
  let flames = FLAME_FINISH;
  if (sim.glow >= def.glowGoal) flames |= FLAME_GLOW;
  if (raceTicks(sim) * STEP <= def.par) flames |= FLAME_PAR;
  return flames;
}

export const flameCount = (flames: number) => (flames & 1) + ((flames >> 1) & 1) + ((flames >> 2) & 1);

/** Every flame earned on every route. */
export function totalFlames(progress: Partial<Record<RouteId, { flames: number }>>): number {
  let total = 0;
  for (const entry of Object.values(progress)) if (entry) total += flameCount(entry.flames);
  return total;
}

export const isOpen = (def: Pick<RouteDef, "unlock">, total: number) => total >= def.unlock;
