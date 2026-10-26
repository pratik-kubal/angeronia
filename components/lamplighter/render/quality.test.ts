import { describe, expect, it } from "vitest";
import { createGovernor, feed, TIERS } from "./quality";

const run = (g: ReturnType<typeof createGovernor>, ms: number, frames: number) => {
  let tier = g.tier;
  for (let i = 0; i < frames; i++) tier = feed(g, ms);
  return tier;
};

describe("the quality governor", () => {
  it("holds the top tier at a steady 60 a second", () => {
    expect(run(createGovernor(), 16.7, 2000)).toBe(0);
  });

  it("steps down after a run of slow frames, one tier at a time", () => {
    const g = createGovernor();
    expect(run(g, 24, 30)).toBe(0);
    expect(run(g, 24, 20)).toBe(1);
    expect(run(g, 24, 45)).toBe(2);
  });

  it("goes no lower than the last tier", () => {
    expect(run(createGovernor(), 60, 5000)).toBe(TIERS.length - 1);
  });

  it("steps back up after a long run of fast frames", () => {
    const g = createGovernor();
    run(g, 24, 80);
    expect(g.tier).toBe(1);
    expect(run(g, 8, 100)).toBe(1);
    expect(run(g, 8, 400)).toBe(0);
  });

  it("stops retrying a tier it has dropped from twice", () => {
    const g = createGovernor();
    for (let k = 0; k < 2; k++) {
      run(g, 24, 80);
      expect(g.tier).toBe(1);
      run(g, 8, 500);
      if (k === 0) expect(g.tier).toBe(0);
    }
    expect(run(g, 8, 2000)).toBe(1);
  });

  it("treats a steady 30 a second (Low Power Mode) as a cap, not trouble", () => {
    const g = createGovernor();
    let ms = 33.3;
    for (let i = 0; i < 2000; i++) feed(g, (ms = ms === 33.3 ? 33.4 : 33.3));
    expect(g.capped).toBe(true);
    expect(g.tier).toBe(0);
  });

  it("ignores the gap when the page comes back from hidden", () => {
    const g = createGovernor();
    run(g, 16.7, 100);
    feed(g, 4000);
    expect(g.tier).toBe(0);
    expect(g.ema).toBeLessThan(20);
  });
});
