// Small routes for the tests: a flat ribbon with whatever placements a test needs.

import { compileRoute, type Compiled } from "./compiled";
import type { Place, Seg } from "./route";

export function testRoute(places: Place[] = [], segs: Seg[] = [{ len: 200 }], half = 3): Compiled {
  return compileRoute({
    id: "first-light",
    version: 1,
    par: 60,
    glowGoal: 10,
    unlock: 0,
    start: { half },
    segs,
    places,
    look: { tint: "#000", moon: 0, props: [] },
    map: { x: 0, y: 0 },
  });
}
