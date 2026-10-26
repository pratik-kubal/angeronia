import { describe, expect, it } from "vitest";
import { ROUTES, compiled } from "./routes";
import { testRoute } from "./test-routes";

describe("expandPlaces", () => {
  it("lays a line of sparks out evenly, from one side to the other", () => {
    const { items } = testRoute([{ kind: "sparks", s: 10, n: 5, x: -2, to: 2 }]);
    expect(items.map((it) => it.s)).toEqual([10, 12, 14, 16, 18]);
    expect(items.map((it) => it.x)).toEqual([-2, -1, 0, 1, 2]);
    expect(items.every((it) => it.h === 0 && it.kind === "spark")).toBe(true);
  });

  it("bows an arc up to its height at the middle and down to the ribbon at its ends", () => {
    const { items } = testRoute([{ kind: "sparks", s: 10, n: 5, arc: 1, every: 1 }]);
    expect(items.map((it) => it.h)).toEqual([0, 0.75, 1, 0.75, 0]);
  });

  it("strings a thread right across the ribbon unless told otherwise", () => {
    const { items } = testRoute([{ kind: "thread", s: 40 }, { kind: "thread", s: 60, from: 0, to: 2 }]);
    expect(items[0]).toMatchObject({ x: 0, r: 4 });
    expect(items[1]).toMatchObject({ x: 1, r: 1 });
  });

  it("keeps rain and bat timings in ticks", () => {
    const { items } = testRoute([
      { kind: "rain", s: 40, x: 1, every: 1.5, at: 0.5 },
      { kind: "bat", s: 60, x: 0, swing: 2, every: 2, at: 1 },
    ]);
    expect(items[0]).toMatchObject({ kind: "rain", a: 90, b: 30 });
    expect(items[1]).toMatchObject({ kind: "bat", a: 2, b: 120, c: 60 });
  });

  it("sorts along the ribbon and keeps lamps, wind and lines apart from the items", () => {
    const placed = testRoute([
      { kind: "lamp", s: 90 },
      { kind: "say", s: 5, line: "steer" },
      { kind: "gust", s: 50, len: 20, push: 4 },
      { kind: "dew", s: 70, x: 0 },
      { kind: "blossom", s: 30, x: 1 },
    ]);
    expect(placed.items.map((it) => it.kind)).toEqual(["blossom", "dew"]);
    expect(placed.lamps).toEqual([90]);
    expect(placed.zones).toEqual([{ s: 50, end: 70, push: 4 }]);
    expect(placed.says).toEqual([{ s: 5, line: "steer" }]);
  });
});

describe.each(ROUTES.map((def) => [def.id] as const))("%s", (id) => {
  const route = compiled(id);

  it("numbers its items in order along the ribbon", () => {
    route.items.forEach((it, i) => {
      expect(it.id).toBe(i);
      if (i > 0) expect(it.s).toBeGreaterThanOrEqual(route.items[i - 1].s);
    });
  });

  it("puts everything on the ribbon, before the lantern", () => {
    for (const it of route.items) {
      expect(it.s).toBeGreaterThan(0);
      expect(it.s).toBeLessThan(route.track.length - 5);
    }
    for (const s of route.lamps) expect(s).toBeLessThan(route.track.length - 5);
  });
});
