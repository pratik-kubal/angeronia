import { describe, expect, it } from "vitest";
import { CARDS, cardOf, type Card } from "@/lib/solitaire/cards";
import { deal, type Table } from "@/lib/solitaire/deal";
import { FOUNDATION_IDS, PILE_IDS, TABLEAU_IDS } from "@/lib/solitaire/game";
import { BIG_INDEX_BELOW, chooseArrangement, computeLayout, dropTarget, type Rect } from "./layout";

// Table sizes (CSS px, inside the safe areas, under the browser's bars) where the game is played:
// phones upright and on their side (Chrome on iOS keeps its toolbars: the page never scrolls),
// iPads and desktop windows.
const SIZES: { name: string; w: number; h: number; arrangement: "classic" | "rails" }[] = [
  { name: "iPhone 15 upright, Chrome", w: 393, h: 600, arrangement: "classic" },
  { name: "iPhone 15 upright, Safari", w: 393, h: 659, arrangement: "classic" },
  { name: "iPhone SE upright", w: 375, h: 548, arrangement: "classic" },
  { name: "iPhone mini-width upright", w: 320, h: 500, arrangement: "classic" },
  { name: "iPhone 15 on its side, Chrome", w: 734, h: 321, arrangement: "rails" },
  { name: "iPhone 15 on its side, no insets", w: 852, h: 393, arrangement: "rails" },
  { name: "iPhone SE on its side", w: 667, h: 330, arrangement: "rails" },
  { name: "iPhone Pro Max on its side", w: 814, h: 370, arrangement: "rails" },
  { name: "iPad landscape, Chrome", w: 1180, h: 746, arrangement: "classic" },
  { name: "iPad portrait", w: 820, h: 1100, arrangement: "classic" },
  { name: "MacBook Air, Chrome", w: 1440, h: 790, arrangement: "classic" },
  { name: "desktop", w: 1920, h: 950, arrangement: "classic" },
  { name: "short desktop window", w: 1280, h: 500, arrangement: "rails" },
];

const inside = (r: Rect, W: number, H: number) => r.x >= -0.01 && r.y >= -0.01 && r.x + r.w <= W + 0.01 && r.y + r.h <= H + 0.01;
const overlaps = (a: Rect, b: Rect) => a.x < b.x + b.w - 0.01 && b.x < a.x + a.w - 0.01 && a.y < b.y + b.h - 0.01 && b.y < a.y + a.h - 0.01;

/** The longest column there can be: six face down under a whole King-to-Ace run, in column 6. */
function worstTable(): Table {
  const run: Card[] = Array.from({ length: 13 }, (_, k) => cardOf((k % 2 === 0 ? 1 : 0) as 0 | 1, 13 - k));
  const rest = CARDS.filter((c) => !run.includes(c));
  const tableau = TABLEAU_IDS.map((_, i) => ({ down: rest.slice(i * 6, i * 6 + i), up: [rest[40 + i]] }));
  tableau[6] = { down: rest.slice(30, 36), up: run };
  return { stock: rest.slice(47, 50), waste: rest.slice(36, 39), fan: 3, foundations: [[], [], [], []], tableau };
}

describe("chooseArrangement", () => {
  it.each(SIZES)("$name ($w × $h) plays $arrangement", ({ w, h, arrangement }) => {
    expect(chooseArrangement(w, h).arrangement).toBe(arrangement);
  });

  it("keeps the cards readable: rails on a phone on its side is at least 10% bigger than classic would be", () => {
    const { cardW } = chooseArrangement(734, 321);
    expect(cardW).toBeGreaterThanOrEqual(60);
  });
});

describe("computeLayout", () => {
  for (const size of SIZES) {
    describe(`${size.name} (${size.w} × ${size.h})`, () => {
      const W = size.w;
      const H = size.h;
      const tables = [deal(1), worstTable()];

      it("keeps every slot, control and card on the table", () => {
        for (const t of tables) {
          const l = computeLayout({ w: W, h: H }, t, 3);
          for (const id of PILE_IDS) expect(inside(l.slots[id], W, H), id).toBe(true);
          for (const c of l.controls) expect(inside(c, W, H)).toBe(true);
          l.cards.forEach((p, card) => p && expect(inside({ x: p.x, y: p.y, w: l.cardW, h: l.cardH }, W, H), `card ${card}`).toBe(true));
        }
      });

      it("never lets two piles' slots or a slot and the controls overlap", () => {
        const l = computeLayout({ w: W, h: H }, deal(1));
        const rects = [...PILE_IDS.map((id) => l.slots[id]), ...l.controls];
        for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) expect(overlaps(rects[i], rects[j]), `${i} × ${j}`).toBe(false);
      });

      it("fits the longest column above the controls, each face-up card showing at least 13 px", () => {
        const t = worstTable();
        const l = computeLayout({ w: W, h: H }, t);
        const ys = t.tableau[6].up.map((c) => l.cards[c].y);
        for (let k = 1; k < ys.length; k++) expect(ys[k] - ys[k - 1]).toBeGreaterThanOrEqual(12.9);
        const bottom = ys[ys.length - 1] + l.cardH;
        for (const c of l.controls) if (c.x < l.slots.t6.x + l.cardW && l.slots.t6.x < c.x + c.w) expect(bottom).toBeLessThanOrEqual(c.y + 0.01);
      });

      it("keeps cards 10 px from the screen's edges, to a device pixel (clear of the edge swipe)", () => {
        const l = computeLayout({ w: W, h: H }, deal(1));
        for (const id of PILE_IDS) {
          expect(l.slots[id].x).toBeGreaterThanOrEqual(9);
          expect(W - (l.slots[id].x + l.slots[id].w)).toBeGreaterThanOrEqual(9);
        }
      });

      it("draws the big corner index exactly when the cards are small", () => {
        const l = computeLayout({ w: W, h: H }, deal(1));
        expect(l.bigIndex).toBe(l.cardW < BIG_INDEX_BELOW);
      });
    });
  }

  it("stacks the stock, fans only the latest draw and spreads face-up cards wider than face-down", () => {
    const t = deal(3);
    const l = computeLayout({ w: 1180, h: 746 }, { ...t, waste: t.stock.slice(0, 5), stock: t.stock.slice(5), fan: 2 });
    const w = l.cards;
    const waste = t.stock.slice(0, 5);
    expect(w[waste[0]].x).toBe(w[waste[2]].x);
    expect(w[waste[3]].x).toBe(w[waste[2]].x);
    expect(w[waste[4]].x).toBeGreaterThan(w[waste[3]].x);
    const col = t.tableau[6];
    const downStep = w[col.down[1]].y - w[col.down[0]].y;
    const t2 = { ...t, tableau: t.tableau.map((c, i) => (i === 6 ? { down: c.down, up: [...c.up, t.stock[23]] } : c)) };
    const l2 = computeLayout({ w: 1180, h: 746 }, t2);
    expect(l2.cards[t.stock[23]].y - l2.cards[col.up[0]].y).toBeGreaterThan(downStep);
    expect(l.cards[t.stock[5]].z).toBeLessThan(l.cards[t.stock[t.stock.length - 1]].z);
  });
});

describe("dropTarget", () => {
  const l = computeLayout({ w: 1180, h: 746 }, deal(1));
  const at = (r: Rect, dx = 0, dy = 0): Rect => ({ x: r.x + dx, y: r.y + dy, w: l.cardW, h: l.cardH });

  it("picks the legal pile the card overlaps most", () => {
    const between = at(l.slots.t3, l.cardW * 0.8, l.cardH);
    expect(dropTarget(l, between, ["t3", "t4"])).toBe("t4");
    expect(dropTarget(l, at(l.slots.t3, l.cardW * 0.3, l.cardH), ["t3", "t4"])).toBe("t3");
    expect(dropTarget(l, between, ["t1"])).toBeNull();
  });

  it("sends a card dropped on any foundation to its own suit's", () => {
    expect(dropTarget(l, at(l.slots.f0), ["f2"], "f2")).toBe("f2");
    expect(dropTarget(l, at(l.slots.f3), ["f1", "t6"], "f1")).toBe("f1");
    expect(dropTarget(l, at(l.slots[FOUNDATION_IDS[1]]), [], "f1")).toBeNull();
  });
});
