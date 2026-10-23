"use client";

import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type RefObject } from "react";
import { CARDS, cardName, type Card } from "@/lib/solitaire/cards";
import { FOUNDATION_IDS, PILE_IDS, pileCards, type PileId, type Table as TableState } from "@/lib/solitaire/game";
import type { Hint } from "@/lib/solitaire/hint";
import { locate, runAt } from "@/lib/solitaire/targets";
import type { Animator, Motion } from "./animator";
import { CardView } from "./card";
import type { Layout } from "./layout";
import { useGesture, type GestureHandlers, type GestureState } from "./use-gesture";

type Props = {
  layout: Layout | null;
  table: TableState;
  /** The change to show; a new key plays it, the same key with a new layout just snaps (a resize). */
  motion: { key: string; motion: Motion };
  hint: Hint | null;
  /** A win animation is playing over the table: the cards hide under it. */
  fx: boolean;
  animator: Animator;
  gesture: RefObject<GestureState>;
  handlers: RefObject<GestureHandlers>;
};

/** How long the table waits for the faces to decode before showing the cards anyway. */
const DECODE_WAIT_MS = 4000;

/** The keys that move the focus along the playable cards: from index `i` of `n`, to the result. */
const STEPS: Record<string, (i: number, n: number) => number> = {
  ArrowLeft: (i) => i - 1,
  ArrowUp: (i) => i - 1,
  ArrowRight: (i) => i + 1,
  ArrowDown: (i) => i + 1,
  Home: () => 0,
  End: (_, n) => n - 1,
};

/**
 * The felt: the piles' slots and all 52 cards, rendered once (on the server too) and placed by the
 * animator from the layout. It waits for every face to decode, so no card turns over blank.
 */
export const SolitaireTable = memo(function SolitaireTable({ layout, table, motion, hint, fx, animator, gesture, handlers }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [decoded, setDecoded] = useState(false);
  /** The card focused last, which keeps the Tab stop while it can play. */
  const [focused, setFocused] = useState<Card | null>(null);
  const register = useCallback((card: Card, el: HTMLDivElement | null) => animator.register(card, el), [animator]);
  useGesture(ref, animator, gesture, handlers);

  useEffect(() => {
    const imgs = Array.from(ref.current?.querySelectorAll<HTMLImageElement>(".sol-face") ?? []);
    let live = true;
    const done = () => live && setDecoded(true);
    const timer = setTimeout(done, DECODE_WAIT_MS);
    Promise.all(imgs.map((img) => img.decode().catch(() => {}))).then(done);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, []);

  // A new motion key plays its motion; anything else that changes the layout (a resize) snaps.
  const latest = useRef({ table, motion });
  useLayoutEffect(() => {
    latest.current = { table, motion };
  });
  const played = useRef<string | null>(null);
  useLayoutEffect(() => {
    if (!layout || !decoded) return;
    const { table: t, motion: m } = latest.current;
    const fresh = m.key !== played.current;
    played.current = m.key;
    animator.sync(layout, t, fresh ? m.motion : { kind: "snap" });
  }, [layout, decoded, motion.key, animator]);

  const ready = layout !== null && decoded;
  const style = layout ? ({ "--card-w": `${layout.cardW}px`, "--card-h": `${layout.cardH}px` } as CSSProperties) : undefined;

  // What the accessibility tree and Hint show for each card. The playable cards, in table order (the
  // waste, the foundations, then each column's face-up run from the top of the screen down), are one
  // Tab stop: the arrow keys move along them, as the cards' DOM order is the deck's, not the table's.
  const faceUp = new Set<Card>([...table.waste, ...table.foundations.flat(), ...table.tableau.flatMap((c) => c.up)]);
  const order = [...table.waste.slice(-1), ...table.foundations.flatMap((f) => f.slice(-1)), ...table.tableau.flatMap((c) => c.up)];
  const playable = new Set<Card>(order);
  const tabStop = focused !== null && playable.has(focused) ? focused : order[0];
  const hinted = new Map<Card, "from" | "to">();
  let hintSlot: { pile: PileId; role: "from" | "to" } | null = null;
  let toSlot: PileId | null = null;
  if (hint?.kind === "stock") {
    const top = table.stock[table.stock.length - 1];
    if (top === undefined) hintSlot = { pile: "s", role: "from" };
    else hinted.set(top, "from");
  } else if (hint) {
    for (const card of pileCards(table, hint.from).slice(-hint.count)) hinted.set(card, "from");
    const dest = pileCards(table, hint.to);
    if (dest.length) hinted.set(dest[dest.length - 1], "to");
    else toSlot = hint.to;
  }

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = STEPS[e.key];
    if (step && order.length && !e.altKey && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
      const el = (e.target as HTMLElement).closest("[data-card]") as HTMLElement | null;
      if (!el) return;
      const i = Math.min(order.length - 1, Math.max(0, step(order.indexOf(Number(el.dataset.card)), order.length)));
      e.preventDefault();
      ref.current?.querySelector<HTMLElement>(`[data-card="${order[i]}"]`)?.focus();
      return;
    }
    if (e.key !== "Enter" && e.key !== " ") return;
    const el = (e.target as HTMLElement).closest("[data-card]") as HTMLElement | null;
    if (!el || !gesture.current.enabled) return;
    const where = locate(table, Number(el.dataset.card));
    const run = where && runAt(table, where.pile, where.index);
    if (!run) return;
    e.preventDefault();
    e.stopPropagation();
    handlers.current.onTap(run.from, run.count, pileCards(table, run.from).slice(-run.count));
  };

  const stockLabel = table.stock.length
    ? `Stock, ${table.stock.length} cards: turn three`
    : table.waste.length
      ? "Stock empty: turn the waste over"
      : "Stock empty";

  return (
    <div
      ref={ref}
      className="sol-table"
      style={style}
      data-ready={ready || undefined}
      data-arrangement={layout?.arrangement}
      data-big={layout?.bigIndex || undefined}
      data-fx={fx || undefined}
      onKeyDown={onKey}
      onFocus={(e) => {
        const el = (e.target as HTMLElement).closest("[data-card]") as HTMLElement | null;
        if (el) setFocused(Number(el.dataset.card));
      }}
    >
      {layout &&
        PILE_IDS.map((pile) => {
          const r = layout.slots[pile];
          const slotStyle = { transform: `translate(${r.x}px, ${r.y}px)` };
          const slotHint = hintSlot?.pile === pile ? hintSlot.role : toSlot === pile ? "to" : undefined;
          if (pile === "s")
            return (
              <button
                key={pile}
                type="button"
                className="sol-slot"
                data-slot="s"
                data-empty={table.stock.length === 0 || undefined}
                data-spent={(table.stock.length === 0 && table.waste.length === 0) || undefined}
                data-hint={slotHint}
                style={slotStyle}
                aria-label={stockLabel}
                // Taps and clicks reach the stock through the table's pointer handling; this is for Enter and Space.
                onClick={(e) => e.detail === 0 && handlers.current.onStock()}
              >
                <svg viewBox="0 0 24 24" aria-hidden>
                  <circle cx="12" cy="12" r="8.5" />
                </svg>
              </button>
            );
          const f = FOUNDATION_IDS.indexOf(pile as (typeof FOUNDATION_IDS)[number]);
          return (
            <div key={pile} className="sol-slot" data-slot={pile} data-hint={slotHint} style={slotStyle} aria-hidden>
              {f >= 0 && (
                <svg viewBox="0 0 24 24">
                  <use href={`#sol-suit-${f}`} />
                </svg>
              )}
            </div>
          );
        })}
      {CARDS.map((card) => {
        const inStock = table.stock.includes(card);
        return (
          <CardView
            key={card}
            card={card}
            label={inStock ? null : faceUp.has(card) ? cardName(card) : "Face-down card"}
            playable={playable.has(card)}
            tabbable={card === tabStop}
            hint={hinted.get(card)}
            register={register}
          />
        );
      })}
    </div>
  );
});
