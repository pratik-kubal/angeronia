"use client";

// Taps and drags on the table, from native pointer listeners on the table element (it never
// re-renders away, so a pointer capture survives every move). A press that moves past the slop
// picks the card (and the run on it) up; letting go over a pile it fits drops it there, anywhere
// else it flies home. A press that doesn't move is a tap: the stock deals, a card goes to its best
// place (the screen decides, see targets.ts). Mouse and touch take the same path.

import { useEffect, type RefObject } from "react";
import { suitOf, type Card } from "@/lib/solitaire/cards";
import { FOUNDATION_IDS, PILE_IDS, legalCount, pileCards, type PileId, type Table } from "@/lib/solitaire/game";
import { locate, runAt } from "@/lib/solitaire/targets";
import type { Animator } from "./animator";
import { dropTarget, type Layout } from "./layout";

export type GestureState = { table: Table; layout: Layout | null; enabled: boolean };
export type GestureHandlers = {
  onStock(): void;
  onTap(from: PileId, count: number, cards: Card[]): void;
  onDrop(from: PileId, to: PileId, count: number): void;
};

type Press =
  | { kind: "stock"; pointerId: number }
  | {
      kind: "card";
      pointerId: number;
      x0: number;
      y0: number;
      slop: number;
      from: PileId;
      count: number;
      cards: Card[];
      starts: { x: number; y: number }[] | null;
      dx: number;
      dy: number;
    };

export function useGesture(
  ref: RefObject<HTMLDivElement | null>,
  animator: Animator,
  state: RefObject<GestureState>,
  handlers: RefObject<GestureHandlers>,
) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let press: Press | null = null;
    let frame = 0;
    let over: Element | null = null;

    const mark = (pile: PileId | null) => {
      const next = pile ? el.querySelector(`[data-slot="${pile}"]`) : null;
      if (next === over) return;
      over?.removeAttribute("data-over");
      next?.setAttribute("data-over", "");
      over = next;
    };

    /** Where the held run would drop now. */
    const target = (p: Extract<Press, { kind: "card" }>): PileId | null => {
      const { table, layout } = state.current;
      if (!layout || !p.starts) return null;
      const legal = PILE_IDS.filter((pile) => legalCount(table, p.from, pile) === p.count);
      const rect = { x: p.starts[0].x + p.dx, y: p.starts[0].y + p.dy, w: layout.cardW, h: layout.cardH };
      const own = p.count === 1 ? FOUNDATION_IDS[suitOf(p.cards[0])] : undefined;
      return dropTarget(layout, rect, legal, own);
    };

    const cancel = () => {
      cancelAnimationFrame(frame);
      mark(null);
      if (press?.kind === "card" && press.starts) animator.flyHome(press.cards);
      press = null;
    };

    const onDown = (e: PointerEvent) => {
      if (press || !e.isPrimary || (e.pointerType === "mouse" && e.button !== 0) || !state.current.enabled) return;
      const hit = (e.target as Element).closest("[data-card], [data-slot]") as HTMLElement | null;
      if (!hit) return;
      const { table } = state.current;
      const card = hit.dataset.card === undefined ? null : Number(hit.dataset.card);
      const where = card === null ? null : locate(table, card);
      if (hit.dataset.slot === "s" || where?.pile === "s") press = { kind: "stock", pointerId: e.pointerId };
      else if (where) {
        const run = runAt(table, where.pile, where.index);
        if (!run) return;
        const cards = pileCards(table, run.from).slice(-run.count);
        const slop = e.pointerType === "mouse" ? 4 : 8;
        press = { kind: "card", pointerId: e.pointerId, x0: e.clientX, y0: e.clientY, slop, ...run, cards, starts: null, dx: 0, dy: 0 };
      } else return;
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        // A pointer the browser already let go of: the press still works without capture.
      }
    };

    const onMove = (e: PointerEvent) => {
      if (!press || press.kind !== "card" || e.pointerId !== press.pointerId) return;
      const p = press;
      p.dx = e.clientX - p.x0;
      p.dy = e.clientY - p.y0;
      if (!p.starts) {
        if (Math.hypot(p.dx, p.dy) < p.slop) return;
        p.starts = animator.grab(p.cards);
      }
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (press !== p) return;
        animator.drag(p.cards, p.starts!, p.dx, p.dy);
        mark(target(p));
      });
    };

    const onUp = (e: PointerEvent) => {
      if (!press || e.pointerId !== press.pointerId) return;
      const p = press;
      press = null;
      cancelAnimationFrame(frame);
      mark(null);
      if (p.kind === "stock") return handlers.current.onStock();
      if (!p.starts) return handlers.current.onTap(p.from, p.count, p.cards);
      animator.drag(p.cards, p.starts, p.dx, p.dy);
      const to = target(p);
      if (!to) return animator.flyHome(p.cards);
      animator.release(p.cards);
      handlers.current.onDrop(p.from, to, p.count);
      // A drop the game didn't take (it never should) still ends with the cards at home.
      requestAnimationFrame(() => animator.settle(p.cards));
    };

    const onCancel = (e: PointerEvent) => {
      if (press && e.pointerId === press.pointerId) cancel();
    };
    // While a card is held the page mustn't scroll or pull to refresh (touch-action covers most of it).
    const onTouchMove = (e: TouchEvent) => {
      if (press) e.preventDefault();
    };
    const onContext = (e: Event) => e.preventDefault();
    const onHide = () => {
      if (document.visibilityState !== "visible") cancel();
    };

    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onCancel);
    el.addEventListener("lostpointercapture", onCancel);
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("contextmenu", onContext);
    window.addEventListener("blur", cancel);
    window.addEventListener("resize", cancel);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      cancel();
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onCancel);
      el.removeEventListener("lostpointercapture", onCancel);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("contextmenu", onContext);
      window.removeEventListener("blur", cancel);
      window.removeEventListener("resize", cancel);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, [ref, animator, state, handlers]);
}
