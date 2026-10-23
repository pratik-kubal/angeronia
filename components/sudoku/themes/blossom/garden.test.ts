import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { firefliesIn, gardenLayout, type Pieces, type Pt, type Rect } from "./garden";

// Where Blossom's sky and a solved board's payoff sit, on the game's pieces as measured in Chromium
// at each size, with a short title and a long one. The header's round buttons are see-through, so
// the butterflies and fireflies keep off them (the butterflies off the title too); the moon, where
// it shows, keeps off the title and the home button.

const box = ([x, y, width, height]: readonly number[]): Rect => ({ x, y, width, height });

/** shell, bar, title, gap-a, board, gap-b, rule, pad, dock: [x, y, width, height], for "Easy Puzzle 1". */
const SIZES: Record<string, number[][]> = {
  "small phone (320×568)": [[0, 0, 320, 568], [16, 6, 288, 48], [94.41, 17.25, 131.19, 25.5], [16, 54, 288, 19.59], [16, 73.59, 288, 288], [16, 361.59, 288, 19.61], [16, 381.2, 288, 1], [16, 396.2, 288, 92], [16, 498, 288, 54]],
  "iPhone SE (375×548)": [[0, 0, 375, 548], [16, 6, 343, 48], [121.91, 17.25, 131.19, 25.5], [16, 54, 343, 10], [43.5, 64, 288, 288], [16, 352, 343, 14], [16, 366, 343, 1], [16, 381, 343, 92], [16, 478, 343, 54]],
  "iPhone 15 (393×659)": [[0, 0, 393, 659], [16, 6, 361, 48], [130.91, 17.25, 131.19, 25.5], [16, 54, 361, 23.89], [16.5, 77.89, 360, 360], [16, 437.89, 361, 23.91], [16, 461.8, 361, 1], [16, 476.8, 361, 100.25], [16, 589, 361, 54]],
  "iPad upright (768×1024)": [[0, 0, 768, 1024], [140, 6, 488, 48], [318.41, 17.25, 131.19, 25.5], [140, 54, 488, 56], [141, 110, 486, 486], [140, 596, 488, 191], [140, 787, 488, 1], [140, 802, 488, 120], [140, 946, 488, 62]],
  "small phone on its side (568×320)": [[0, 0, 568, 320], [252, 8, 300, 48], [336.41, 19.25, 131.19, 25.5], [0, 0, 0, 0], [17.48, 52, 216, 216], [0, 0, 0, 0], [0, 0, 0, 0], [252, 174, 300, 78], [252, 260, 300, 52]],
  "SE on its side (667×375)": [[0, 0, 667, 375], [311, 8, 340, 48], [415.41, 19.25, 131.19, 25.5], [0, 0, 0, 0], [18.5, 52.5, 270, 270], [0, 0, 0, 0], [0, 0, 0, 0], [311, 218.5, 340, 88.5], [311, 315, 340, 52]],
  "phone on its side (852×393)": [[0, 0, 852, 393], [496, 8, 340, 48], [600.41, 19.25, 131.19, 25.5], [0, 0, 0, 0], [58.72, 12, 369, 369], [0, 0, 0, 0], [0, 0, 0, 0], [496, 232.56, 340, 92.44], [496, 333, 340, 52]],
  "desktop (1280×800)": [[0, 0, 1280, 800], [396, 6, 488, 48], [574.41, 17.25, 131.19, 25.5], [396, 54, 488, 18.8], [397, 72.8, 486, 486], [396, 558.8, 488, 18.8], [396, 577.59, 488, 1], [396, 592.59, 488, 120], [396, 722, 488, 62]],
};

/** The title's width (the emblem and its words) for a long name, "Medium Puzzle 100": still centred in the bar. */
const LONG_TITLE = 179.45;

const css = readFileSync(join(__dirname, "blossom.css"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");

/** A translate value's two terms ("calc(var(--w) * 0.12) calc(var(--h) * 0.55)"). */
function terms(value: string): string[] {
  const out = [""];
  let depth = 0;
  for (const ch of value.trim()) {
    depth += ch === "(" ? 1 : ch === ")" ? -1 : 0;
    if (ch === " " && depth === 0) out.push("");
    else out[out.length - 1] += ch;
  }
  return out.filter(Boolean);
}

/** A keyframes rule's translate stops in time order (it loops), with its custom properties' values. */
function stops(name: string, vars: Record<string, number>): Pt[] {
  const start = css.indexOf(`@keyframes ${name} {`);
  expect(start).toBeGreaterThanOrEqual(0);
  const body = css.slice(css.indexOf("{", start) + 1, css.indexOf("\n}", start));
  const term = (t: string) => {
    if (t === "0") return 0;
    const m = t.match(/^(?:calc\()?var\(--([\w-]+)\)(?:\s*\*\s*(-?[\d.]+)\))?$/);
    if (!m || !(m[1] in vars)) throw new Error(`${name}: ${t}`);
    return vars[m[1]] * (m[2] === undefined ? 1 : Number(m[2]));
  };
  const frames = [...body.matchAll(/([\d%,\s]+)\{[^{}]*?translate:\s*([^;]+);/g)].flatMap(([, at, value]) => {
    const [x, y] = terms(value).map(term);
    return at.split(",").map((p) => ({ at: parseFloat(p), x, y }));
  });
  expect(frames.length).toBeGreaterThanOrEqual(3);
  return frames.sort((a, b) => a.at - b.at).map(({ x, y }) => ({ x, y }));
}

/** Points along the straight runs between the stops (a translate keyframe moves in a line). */
const along = (points: Pt[]) =>
  points.slice(1).flatMap((b, i) => {
    const a = points[i];
    return Array.from({ length: 21 }, (_, t) => ({ x: a.x + ((b.x - a.x) * t) / 20, y: a.y + ((b.y - a.y) * t) / 20 }));
  });

/** How far a point lies from a box (0 inside it). */
const distance = (p: Pt, r: Rect) =>
  Math.hypot(Math.max(r.x - p.x, 0, p.x - r.x - r.width), Math.max(r.y - p.y, 0, p.y - r.y - r.height));
/** A square of `size` centred on c. */
const square = (c: Pt, size: number): Rect => ({ x: c.x - size / 2, y: c.y - size / 2, width: size, height: size });
const overlaps = (a: Rect, b: Rect) => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

describe.each(Object.entries(SIZES).flatMap(([size, measured]) => [[`${size}, Easy Puzzle 1`, measured, false] as const, [`${size}, Medium Puzzle 100`, measured, true] as const]))(
  "on %s",
  (_, measured, long) => {
    const [shell, bar, dealt, gapA, board, gapB, rule, pad, dock] = measured.map(box);
    const title = long ? { ...dealt, x: dealt.x + dealt.width / 2 - LONG_TITLE / 2, width: LONG_TITLE } : dealt;
    const pieces: Pieces = { shell, bar, title, gapA, board, gapB, rule, pad, dock };
    const garden = gardenLayout(pieces);
    // The header's 44px round buttons, the gear left and home right, centred in its height.
    const middle = bar.y + bar.height / 2;
    const gear = { x: bar.x + 22, y: middle };
    const home = { x: bar.x + bar.width - 22, y: middle };

    it("flutters about the flowers, and about the branch where it has room", () => {
      expect(garden.zones.length).toBeGreaterThanOrEqual(1);
      expect(garden.zones.length).toBeLessThanOrEqual(2);
      for (const z of garden.zones) expect(z.width).toBeGreaterThanOrEqual(36);
    });

    it("keeps the butterflies' loops clear of the gear, the home button and the title", () => {
      // The butterfly's box (backdrop.tsx's Payoff), centred on the sdkBlossomFlutter path.
      const size = garden.mode === "plot" ? 26 : 18;
      for (const z of garden.zones) {
        for (const p of along(stops("sdkBlossomFlutter", { w: z.width, h: z.height }))) {
          const at = { x: z.x + p.x, y: z.y + p.y };
          const fly = square(at, size);
          for (const button of [gear, home]) expect(distance(button, fly), JSON.stringify({ z, at })).toBeGreaterThanOrEqual(22);
          expect(overlaps(fly, title), JSON.stringify({ z, at })).toBe(false);
        }
      }
    });

    it("keeps the fireflies' wanders clear of the gear and the home button", () => {
      // A firefly's glow, 16px across, on the sdkBlossomFirefly path from where it starts.
      garden.zones.forEach((z, k) => {
        for (const f of firefliesIn(z, k)) {
          for (const p of along(stops("sdkBlossomFirefly", { dx: f.dx, dy: f.dy }))) {
            const at = { x: f.x + p.x, y: f.y + p.y };
            for (const button of [gear, home]) expect(Math.hypot(at.x - button.x, at.y - button.y), JSON.stringify({ k, at })).toBeGreaterThanOrEqual(22 + 8);
          }
        }
      });
    });

    it.runIf(!long)("keeps a moon with a short title", () => {
      expect(garden.moon.size).toBeGreaterThanOrEqual(14);
    });

    it.runIf(garden.moon.size > 0)("keeps the moon clear of the title and the home button", () => {
      const { moon } = garden;
      const r = moon.size / 2;
      expect(distance(moon, title)).toBeGreaterThanOrEqual(r);
      expect(Math.hypot(moon.x - home.x, moon.y - home.y)).toBeGreaterThanOrEqual(22 + r);
    });
  },
);
