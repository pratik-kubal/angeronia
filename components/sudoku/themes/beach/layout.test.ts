import { describe, expect, it } from "vitest";
import type { Anchor } from "../use-anchor";
import { beachLayout, type Mode, type Rect, type Spot } from "./layout";

// Where the cove's pieces sit, on the game's pieces as measured in Chromium at each size: nothing on
// the sand is drawn behind a key, the clock, the dock or the board, and on a desktop the panorama
// stays beside the column, the pad and the dock included (on a short window they are wider than the
// shrunken board).

type Box = { left: number; top: number; right: number; bottom: number };
const anchor = ([x, y, width, height]: readonly number[]): Anchor => ({ x, y, width, height });
const edges = (a: Anchor): Box => ({ left: a.x, top: a.y, right: a.x + a.width, bottom: a.y + a.height });
const ofRect = (r: Rect): Box => ({ left: r.x, top: r.y, right: r.x + r.w, bottom: r.y + r.h });
const ofSpot = ({ x, y, s }: Spot): Box => ({ left: x - s / 2, top: y - s / 2, right: x + s / 2, bottom: y + s / 2 });
/** Overlapping by more than a pixel each way (the castle stands on the board's top edge). */
const overlaps = (a: Box, b: Box) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1;

/** shell, bar, title, board, rule, pad, dock: [x, y, width, height], for "Easy Puzzle 1"; and the mode. */
const SIZES: Record<string, [number[][], Mode]> = {
  "iPhone 15 (393×659)": [[[0, 0, 393, 659], [16, 6, 361, 48], [130.91, 17.25, 131.19, 25.5], [16.5, 77.89, 360, 360], [16, 461.8, 361, 1], [16, 476.8, 361, 100.25], [16, 589, 361, 54]], "compact"],
  "iPhone SE (375×548)": [[[0, 0, 375, 548], [16, 6, 343, 48], [121.91, 17.25, 131.19, 25.5], [43.5, 64, 288, 288], [16, 366, 343, 1], [16, 381, 343, 92], [16, 478, 343, 54]], "compact"],
  "small phone (320×568)": [[[0, 0, 320, 568], [16, 6, 288, 48], [94.41, 17.25, 131.19, 25.5], [16, 73.59, 288, 288], [16, 381.2, 288, 1], [16, 396.2, 288, 92], [16, 498, 288, 54]], "compact"],
  "phone on its side (852×393)": [[[0, 0, 852, 393], [496, 8, 340, 48], [600.41, 19.25, 131.19, 25.5], [58.72, 12, 369, 369], [0, 0, 0, 0], [496, 232.56, 340, 92.44], [496, 333, 340, 52]], "side"],
  "SE on its side (667×375)": [[[0, 0, 667, 375], [319.5, 8, 331.5, 48], [419.66, 19.25, 131.19, 25.5], [18.25, 48, 279, 279], [0, 0, 0, 0], [319.5, 218.5, 331.5, 88.5], [319.5, 315, 331.5, 52]], "side"],
  "iPad upright (768×1024)": [[[0, 0, 768, 1024], [140, 6, 488, 48], [318.41, 17.25, 131.19, 25.5], [141, 110, 486, 486], [140, 787, 488, 1], [140, 802, 488, 120], [140, 946, 488, 62]], "compact"],
  // A short window too narrow for the castle beside the column (the board alone would leave room).
  "short window (900×560)": [[[0, 0, 900, 560], [206, 6, 488, 48], [384.41, 17.25, 131.19, 25.5], [297, 62, 306, 306], [206, 382, 488, 1], [206, 397, 488, 92], [206, 490, 488, 54]], "compact"],
  // Just room: 220px beside the column.
  "short window (928×560)": [[[0, 0, 928, 560], [220, 6, 488, 48], [398.41, 17.25, 131.19, 25.5], [311, 62, 306, 306], [220, 382, 488, 1], [220, 397, 488, 92], [220, 490, 488, 54]], "wide"],
  "short window (960×600)": [[[0, 0, 960, 600], [236, 6, 488, 48], [414.41, 17.25, 131.19, 25.5], [309, 62.67, 342, 342], [236, 418.67, 488, 1], [236, 433.67, 488, 92], [236, 530, 488, 54]], "wide"],
  "short window (1000×560)": [[[0, 0, 1000, 560], [256, 6, 488, 48], [434.41, 17.25, 131.19, 25.5], [347, 62, 306, 306], [256, 382, 488, 1], [256, 397, 488, 92], [256, 490, 488, 54]], "wide"],
  "netbook (1024×600)": [[[0, 0, 1024, 600], [268, 6, 488, 48], [446.41, 17.25, 131.19, 25.5], [341, 62.67, 342, 342], [268, 418.67, 488, 1], [268, 433.67, 488, 92], [268, 530, 488, 54]], "wide"],
  "iPad on its side (1024×768)": [[[0, 0, 1024, 768], [268, 6, 488, 48], [446.41, 17.25, 131.19, 25.5], [273.5, 64.05, 477, 477], [268, 555.05, 488, 1], [268, 570.05, 488, 115.5], [268, 690.56, 488, 61.44]], "wide"],
  "short window (1100×600)": [[[0, 0, 1100, 600], [306, 6, 488, 48], [484.41, 17.25, 131.19, 25.5], [379, 62.67, 342, 342], [306, 418.67, 488, 1], [306, 433.67, 488, 92], [306, 530, 488, 54]], "wide"],
  "iPad Air on its side (1180×820)": [[[0, 0, 1180, 820], [346, 6, 488, 48], [524.41, 17.25, 131.19, 25.5], [347, 80.8, 486, 486], [346, 593.59, 488, 1], [346, 608.59, 488, 120], [346, 742, 488, 62]], "wide"],
  "laptop (1280×633)": [[[0, 0, 1280, 633], [396, 6, 488, 48], [574.41, 17.25, 131.19, 25.5], [455.5, 63.61, 369, 369], [396, 446.61, 488, 1], [396, 461.61, 488, 96.59], [396, 563, 488, 54]], "wide"],
  "desktop (1280×800)": [[[0, 0, 1280, 800], [396, 6, 488, 48], [574.41, 17.25, 131.19, 25.5], [397, 72.8, 486, 486], [396, 577.59, 488, 1], [396, 592.59, 488, 120], [396, 722, 488, 62]], "wide"],
  "laptop (1366×657)": [[[0, 0, 1366, 657], [439, 6, 488, 48], [617.41, 17.25, 131.19, 25.5], [485, 62, 396, 396], [439, 472, 488, 1], [439, 487, 488, 99.97], [439, 587, 488, 54]], "wide"],
  "laptop (1440×789)": [[[0, 0, 1440, 789], [476, 6, 488, 48], [654.41, 17.25, 131.19, 25.5], [477, 69.02, 486, 486], [476, 570.05, 488, 1], [476, 585.05, 488, 118.44], [476, 711, 488, 62]], "wide"],
  "desktop (1920×1080)": [[[0, 0, 1920, 1080], [716, 6, 488, 48], [894.41, 17.25, 131.19, 25.5], [717, 110, 486, 486], [716, 843, 488, 1], [716, 858, 488, 120], [716, 1002, 488, 62]], "wide"],
};

describe.each(Object.entries(SIZES))("on %s", (_, [measured, mode]) => {
  const [shell, bar, title, board, rule, pad, dock] = measured.map(anchor);
  const layout = beachLayout({ shell, bar, title, board, rule, pad, dock });
  const { k, bucket, umbrella, boat, lighthouse } = layout.props;

  // The keys: the top row (1 to 5) leaves half a key free at each end, the bottom one (the pencil,
  // 6 to 9 and the clock) fills the pad's width.
  const col = pad.width / 12;
  const keyH = (pad.height - (mode === "side" ? 6 : 8)) / 2;
  const keys = [
    { left: pad.x + col, top: pad.y, right: pad.x + pad.width - col, bottom: pad.y + keyH },
    { left: pad.x, top: pad.y + pad.height - keyH, right: pad.x + pad.width, bottom: pad.y + pad.height },
  ];
  const taken = [...keys, edges(dock), edges(board)];

  // What lies on the sand, as drawn (the umbrella's box is wider than its art).
  const sand: [string, Box][] = [
    ...(layout.castle ? [["castle", ofRect(layout.castle)] as [string, Box]] : []),
    ...(layout.crab ? [["crab", ofSpot(layout.crab)] as [string, Box]] : []),
    ...layout.shells.map((s, i): [string, Box] => [`shell ${i}`, ofSpot(s)]),
    ...layout.starfish.map((s, i): [string, Box] => [`starfish ${i}`, ofSpot(s)]),
    ...(bucket ? [["bucket", { left: bucket.x - 28 * bucket.s, top: bucket.y - 25 * bucket.s, right: bucket.x + 28 * bucket.s, bottom: bucket.y + 25 * bucket.s }] as [string, Box]] : []),
  ];
  if (layout.mode === "wide") {
    sand.push(["fry", ofSpot(layout.fry)]);
    if (umbrella) sand.push(["umbrella", { left: umbrella.x - 90 * k, top: umbrella.y - 137 * k, right: umbrella.x + 106 * k, bottom: umbrella.y + 55 * k }]);
  }

  it(`is ${mode}`, () => {
    expect(layout.mode).toBe(mode);
  });

  it("keeps the sand's pieces off the keys, the clock, the dock and the board", () => {
    for (const [name, box] of sand) {
      for (const t of taken) expect(overlaps(box, t), `${name} at ${JSON.stringify(box)} meets ${JSON.stringify(t)}`).toBe(false);
    }
  });

  it.runIf(mode === "wide")("lays the panorama out beside the column, on screen", () => {
    const colLeft = Math.min(board.x, pad.x, dock.x);
    const colRight = Math.max(board.x + board.width, pad.x + pad.width, dock.x + dock.width);
    const sea: [string, Box][] = [
      ["sun", { left: layout.sun.x - layout.sun.r, top: 0, right: layout.sun.x + layout.sun.r, bottom: 0 }],
      ["lighthouse", { left: lighthouse!.x - 30 * k, top: 0, right: lighthouse!.x + 30 * k, bottom: 0 }],
      ["boat", { left: boat!.x - 27 * k, top: 0, right: boat!.x + 27 * k, bottom: 0 }],
    ];
    for (const [name, box] of [...sand, ...sea]) {
      expect(box.right <= colLeft || box.left >= colRight, `${name} at ${box.left}…${box.right} beside ${colLeft}…${colRight}`).toBe(true);
      expect(box.left, name).toBeGreaterThanOrEqual(0);
      expect(box.right, name).toBeLessThanOrEqual(shell.width);
    }
  });
});
