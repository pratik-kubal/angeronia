import { describe, expect, it } from "vitest";
import type { Anchor } from "../use-anchor";
import { layoutOf, moonPhase, type Pieces } from "./layout";

// Where the Halloween scene sits, on the game's pieces as measured in Chromium at each size, with a
// short title and a long one: the nine pumpkins and the moon always find room, and never sit on a
// cell, a control or the title.

type Box = { left: number; top: number; right: number; bottom: number };
const box = ([x, y, width, height]: readonly number[]): Anchor => ({ x, y, width, height });
const edges = (a: Anchor): Box => ({ left: a.x, top: a.y, right: a.x + a.width, bottom: a.y + a.height });
const overlaps = (a: Box, b: Box) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

/** shell, game, bar, title, gap-a, board, gap-b, pad, dock: [x, y, width, height], for "Easy Puzzle 1". */
const SIZES: Record<string, number[][]> = {
  "iPhone 15 (393×659)": [[0, 0, 393, 659], [0, 0, 393, 659], [16, 6, 361, 48], [130.91, 17.25, 131.19, 25.5], [16, 54, 361, 23.89], [16.5, 77.89, 360, 360], [16, 437.89, 361, 23.91], [16, 476.8, 361, 100.25], [16, 589, 361, 54]],
  // A gap under the board just over 20px: the row on the divider at its smallest.
  "iPhone 15, a little shorter (393×650)": [[0, 0, 393, 650], [0, 0, 393, 650], [16, 6, 361, 48], [130.91, 17.25, 131.19, 25.5], [16, 54, 361, 20.8], [16.5, 74.8, 360, 360], [16, 434.8, 361, 20.8], [16, 470.59, 361, 99], [16, 580, 361, 54]],
  "iPhone SE (375×548)": [[0, 0, 375, 548], [0, 0, 375, 548], [16, 6, 343, 48], [121.91, 17.25, 131.19, 25.5], [16, 54, 343, 10], [43.5, 64, 288, 288], [16, 352, 343, 14], [16, 381, 343, 92], [16, 478, 343, 54]],
  "small phone (320×568)": [[0, 0, 320, 568], [0, 0, 320, 568], [16, 6, 288, 48], [94.41, 17.25, 131.19, 25.5], [16, 54, 288, 19.59], [16, 73.59, 288, 288], [16, 361.59, 288, 19.61], [16, 396.2, 288, 92], [16, 498, 288, 54]],
  // Safari with its toolbars out: no room under the board nor beside it.
  "iPhone 15, short (393×610)": [[0, 0, 393, 610], [0, 0, 393, 610], [16, 6, 361, 48], [130.91, 17.25, 131.19, 25.5], [16, 54, 361, 8.42], [21, 62.42, 351, 351], [16, 413.42, 361, 14], [16, 442.42, 361, 93.38], [16, 540, 361, 54]],
  "phone on its side (852×393)": [[0, 0, 852, 393], [0, 0, 852, 393], [496, 8, 340, 48], [600.41, 19.25, 131.19, 25.5], [0, 0, 0, 0], [58.72, 12, 369, 369], [0, 0, 0, 0], [496, 232.56, 340, 92.44], [496, 333, 340, 52]],
  // The same with an iPhone 15's safe-area insets on its side (59px each side, 21px under; the
  // shell's padding), its left margin under the Dynamic Island.
  "iPhone 15 on its side, its insets (852×393)": [[0, 0, 852, 393], [59, 0, 734, 372], [437, 8, 340, 48], [541.41, 19.25, 131.19, 25.5], [0, 0, 0, 0], [76.72, 19.5, 333, 333], [0, 0, 0, 0], [437, 211.56, 340, 92.44], [437, 312, 340, 52]],
  "SE on its side (667×375)": [[0, 0, 667, 375], [0, 0, 667, 375], [311, 8, 340, 48], [415.41, 19.25, 131.19, 25.5], [0, 0, 0, 0], [18.5, 52.5, 270, 270], [0, 0, 0, 0], [311, 218.5, 340, 88.5], [311, 315, 340, 52]],
  "Android on its side (740×360)": [[0, 0, 740, 360], [0, 0, 740, 360], [384, 8, 340, 48], [488.41, 19.25, 131.19, 25.5], [0, 0, 0, 0], [17.91, 9, 342, 342], [0, 0, 0, 0], [384, 206.81, 340, 85.19], [384, 300, 340, 52]],
  "iPad upright (768×1024)": [[0, 0, 768, 1024], [124, 0, 520, 1024], [140, 6, 488, 48], [318.41, 17.25, 131.19, 25.5], [140, 54, 488, 56], [141, 110, 486, 486], [140, 596, 488, 191], [140, 802, 488, 120], [140, 946, 488, 62]],
  "iPad on its side (1024×768)": [[0, 0, 1024, 768], [252, 0, 520, 768], [268, 6, 488, 48], [446.41, 17.25, 131.19, 25.5], [268, 54, 488, 10.05], [273.5, 64.05, 477, 477], [268, 541.05, 488, 14], [268, 570.05, 488, 115.5], [268, 690.56, 488, 61.44]],
  "desktop (1280×800)": [[0, 0, 1280, 800], [380, 0, 520, 800], [396, 6, 488, 48], [574.41, 17.25, 131.19, 25.5], [396, 54, 488, 18.8], [397, 72.8, 486, 486], [396, 558.8, 488, 18.8], [396, 592.59, 488, 120], [396, 722, 488, 62]],
  // Devtools docked at the bottom: a wide screen in the side-by-side grid.
  "short desktop (1280×500)": [[0, 0, 1280, 500], [180, 0, 920, 500], [744, 8, 340, 48], [848.41, 19.25, 131.19, 25.5], [0, 0, 0, 0], [217.5, 11.5, 477, 477], [0, 0, 0, 0], [744, 326, 340, 106], [744, 440, 340, 52]],
};

/** The title's width (the emblem and its words) for a long name, "Medium Puzzle 100": still centred in the bar. */
const LONG_TITLE = 179.45;

describe.each(Object.entries(SIZES).flatMap(([size, measured]) => [[`${size}, Easy Puzzle 1`, measured, false] as const, [`${size}, Medium Puzzle 100`, measured, true] as const]))(
  "on %s",
  (_, measured, long) => {
    const [shell, game, bar, dealt, gapA, board, gapB, pad, dock] = measured.map(box);
    const title = long ? { ...dealt, x: dealt.x + dealt.width / 2 - LONG_TITLE / 2, width: LONG_TITLE } : dealt;
    const pieces: Pieces = { shell, game, bar, title, gapA, board, gapB, pad };
    const layout = layoutOf(pieces);
    // The round buttons at each end of the bar, and the title (its emblem and words) with room around them.
    const header = { left: title.x - 12, top: bar.y, right: title.x + title.width + 12, bottom: title.y + title.height + 4 };
    const buttons = [
      { left: bar.x, top: bar.y, right: bar.x + 44, bottom: bar.y + 44 },
      { left: bar.x + bar.width - 44, top: bar.y, right: bar.x + bar.width, bottom: bar.y + 44 },
    ];
    const taken = [edges(board), edges(pad), edges(dock), header, ...buttons];
    const pumpkins = layout.sill?.pumpkins.map((p) => ({ left: p.x - p.size / 2, top: p.y - (p.size * 30) / 32, right: p.x + p.size / 2, bottom: p.y })) ?? [];
    const { moon } = layout;
    const disc = { left: moon.x - moon.r, top: moon.y - moon.r, right: moon.x + moon.r, bottom: moon.y + moon.r };

    it("lines up nine pumpkins, one for each box", () => {
      expect(layout.sill).not.toBeNull();
      expect(layout.sill!.pumpkins.map((p) => p.box).sort()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
      // At least 18px wide, or 14px on an upright phone where they fill a gap under the board thinner than that.
      const least = layout.mode === "tall" && gapB.height < 18 ? 14 : 18;
      for (const p of layout.sill!.pumpkins) expect(p.size).toBeGreaterThanOrEqual(least);
    });

    it("keeps a moon of some size", () => {
      expect(moon.r).toBeGreaterThanOrEqual(11);
    });

    it.runIf(bar.x > board.x + board.width)("lines the surprises up in the free band between the header and the pad", () => {
      for (const y of [layout.parade.y, layout.rest]) {
        expect(y).toBeGreaterThan(bar.y + bar.height);
        expect(y).toBeLessThan(pad.y);
      }
    });

    it.runIf(bar.x > board.x + board.width)("walks the parade out from behind the board", () => {
      expect(layout.parade.clip).toBeGreaterThanOrEqual(board.x + board.width);
      expect(layout.parade.clip).toBeLessThan(bar.x);
    });

    it("lands Boo and his \"boo!\" on screen, clear of the board, the buttons and the title's words", () => {
      const { emblem, boo } = layout;
      const { bubble } = boo;
      const words = { left: title.x + 26, top: title.y, right: title.x + title.width, bottom: title.y + title.height };
      const clear = [edges(board), words, ...buttons];
      const at = (t: number) => ({ x: emblem.x + boo.x + (boo.away.x - boo.x) * t, y: emblem.y + boo.y + (boo.away.y - boo.y) * t });
      // His box, 40×45 at his size, 8% over as he pops, then shrinking to 80% as he flies off.
      const ghost = (t: number, over: number) => {
        const { x, y } = at(t);
        const k = boo.scale * over * (1 - 0.2 * t);
        return { left: x - 20 * k, top: y - 22.5 * k, right: x + 20 * k, bottom: y + 22.5 * k };
      };
      // The bubble as measured ("boo!" in 13px type, 46×20), 12% over as it pops from its tail.
      const w = 46 * 1.12 * bubble.scale;
      const h = 20 * 1.12 * bubble.scale;
      const left = emblem.x + boo.x + bubble.x;
      const top = emblem.y + boo.y + bubble.y;
      const said = bubble.under ? { left, top, right: left + w, bottom: top + h } : { left, top: top + 20 * bubble.scale - h, right: left + w, bottom: top + 20 * bubble.scale };
      // He says it on every screen measured.
      expect(bubble.scale).toBeGreaterThanOrEqual(0.7);
      for (const thing of [ghost(0, 1.08), said]) {
        expect(thing.left).toBeGreaterThanOrEqual(0);
        expect(thing.top).toBeGreaterThanOrEqual(0);
        expect(thing.right).toBeLessThanOrEqual(shell.width);
        for (const piece of clear) expect(overlaps(thing, piece), JSON.stringify({ thing, piece })).toBe(false);
      }
      // And flies off without crossing any of them.
      for (let t = 0; t <= 1; t += 0.1) for (const piece of clear) expect(overlaps(ghost(t, 1), piece), JSON.stringify({ t, piece })).toBe(false);
    });

    it("keeps the pumpkins and the moon on screen, off the game and apart", () => {
      const screen = edges(shell);
      for (const thing of [...pumpkins, disc]) {
        expect(thing.left).toBeGreaterThanOrEqual(screen.left);
        expect(thing.right).toBeLessThanOrEqual(screen.right);
        expect(thing.top).toBeGreaterThanOrEqual(screen.top);
        expect(thing.bottom).toBeLessThanOrEqual(screen.bottom);
        for (const piece of taken) expect(overlaps(thing, piece), JSON.stringify({ thing, piece })).toBe(false);
      }
      for (const p of pumpkins) expect(overlaps(p, disc)).toBe(false);
      // Inside the column, clear of the shell's padding (the safe area's inset): every pumpkin right
      // of its left edge, and on a phone or a tablet the moon and the whole row within it.
      const column = edges(game);
      for (const p of pumpkins) expect(p.left).toBeGreaterThanOrEqual(column.left);
      if (layout.mode !== "wide")
        for (const thing of [...pumpkins, disc]) {
          expect(thing.right).toBeLessThanOrEqual(column.right);
          expect(thing.top).toBeGreaterThanOrEqual(column.top);
          expect(thing.bottom).toBeLessThanOrEqual(column.bottom);
        }
    });
  },
);

describe("the sill under an upright board", () => {
  it("never shrinks as the gap under the board grows", () => {
    const [shell, game, bar, title, gapA, board, , pad] = SIZES["iPhone 15 (393×659)"].map(box);
    let last = 0;
    for (let height = 10; height <= 36; height += 0.25) {
      const gapB = { x: 16, y: board.y + board.height, width: 361, height };
      const { size } = layoutOf({ shell, game, bar, title, gapA, board, gapB, pad }).sill!.pumpkins[0];
      expect(size, `a gap of ${height}px`).toBeGreaterThanOrEqual(last);
      last = size;
    }
  });
});

describe("the moon's phase", () => {
  it("is a sliver at the deal and full when the board is", () => {
    expect(moonPhase(0.3)).toBeLessThan(0.1);
    expect(moonPhase(0.62)).toBeCloseTo(0.49, 2);
    expect(moonPhase(1)).toBe(1);
  });
});
