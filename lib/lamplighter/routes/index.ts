// Every route, in the order the map opens them.

import { compileRoute, type Compiled } from "../compiled";
import type { RouteDef, RouteId } from "../route";
import { firstLight } from "./first-light";

export const ROUTES: readonly RouteDef[] = [firstLight];

export function routeDef(id: RouteId): RouteDef {
  const def = ROUTES.find((r) => r.id === id);
  if (!def) throw new Error(`No route ${id}`);
  return def;
}

const cache = new Map<RouteId, Compiled>();

/** A route compiled once and kept: the ribbon and its items never change during a session. */
export function compiled(id: RouteId): Compiled {
  let c = cache.get(id);
  if (!c) cache.set(id, (c = compileRoute(routeDef(id))));
  return c;
}
