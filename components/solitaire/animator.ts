// The one thing that moves cards. React renders the 52 card nodes once, in a fixed order, and never
// touches their transform, stacking or face: the animator does, imperatively. When the layout
// changes it flies every card from where it is now to its new place (the Web Animations API on
// transform only), lifted above the table for the flight, turns cards over with a squash, and
// holds dragged cards under the pointer. Node order never changes, so WebKit never drops a running
// animation or a pointer capture.

import type { Card } from "@/lib/solitaire/cards";
import type { Effect, Table } from "@/lib/solitaire/game";
import type { Layout, Place } from "./layout";

export type Motion =
  /** Straight to place: a resume, another tab's move, a resize. */
  | { kind: "snap" }
  /** A fresh deal: the columns fly out of the stock, row by row as dealt by hand. */
  | { kind: "deal" }
  | { kind: "move" | "finish" | "undo"; effects: Effect[] };

type Pos = { x: number; y: number };

const EASE = "cubic-bezier(0.2, 0.7, 0.3, 1)";
const FLIP_MS = 220;
const DRAW_STAGGER = 70;
const FINISH_STAGGER = 70;
const DEAL_STAGGER = 35;
/** Stacking for cards in flight and in hand, above every card at rest. */
const FLYING_Z = 1000;
const HELD_Z = 2000;

const translate = (p: Pos) => `translate(${p.x}px, ${p.y}px)`;
const flightMs = (from: Pos, to: Pos) => Math.min(380, Math.max(160, 150 + 0.25 * Math.hypot(to.x - from.x, to.y - from.y)));

export class Animator {
  private els: (HTMLElement | null)[] = Array(52).fill(null);
  /** Where each card's inline transform puts it (its destination while it flies). */
  private at: (Pos | null)[] = Array(52).fill(null);
  private places: (Place | null)[] = Array(52).fill(null);
  private flights = new Map<Card, Animation>();
  private flips = new Map<Card, { anim: Animation; timer: number }>();
  private held = new Set<Card>();

  constructor(private reduced: () => boolean) {}

  register(card: Card, el: HTMLElement | null) {
    this.els[card] = el;
    if (!el) {
      this.at[card] = null;
      this.flights.delete(card);
    }
  }

  /** Brings every card to its place in `layout` (laid out from `table`), as `motion` says. */
  sync(layout: Layout, table: Table, motion: Motion) {
    const snap = motion.kind === "snap" || this.reduced();
    const timing = snap ? null : this.timing(layout, table, motion);
    layout.cards.forEach((place, card) => {
      const el = this.els[card];
      if (!place || !el) return;
      this.places[card] = place;
      if (this.held.has(card)) return;
      if (!timing || (!this.at[card] && !timing.from.has(card))) {
        this.stop(card);
        this.put(card, place, place.z);
        this.face(card, place.up, null);
        return;
      }
      const from = timing.from.get(card) ?? this.current(card);
      const delay = timing.delay.get(card) ?? 0;
      const moved = Math.abs(from.x - place.x) > 0.5 || Math.abs(from.y - place.y) > 0.5;
      let landed = 0;
      if (moved || timing.from.has(card)) landed = this.fly(card, from, place, delay);
      else if (!this.flights.has(card)) el.style.zIndex = String(place.z);
      if (timing.faceDown.has(card)) this.face(card, false, null);
      // A card turns over mid-flight, or (uncovered by the move) once the moving cards land.
      this.face(card, place.up, landed ? delay + (landed - FLIP_MS) / 2 : timing.turnAfter);
    });
  }

  /** Stagger and starting points for the cards a motion moves. */
  private timing(layout: Layout, table: Table, motion: Motion) {
    const delay = new Map<Card, number>();
    const from = new Map<Card, Pos>();
    const faceDown = new Set<Card>();
    let turnAfter = 0;
    if (motion.kind === "deal") {
      const stock = layout.slots.s;
      // Row by row: row r reaches columns r…6. The cards face down until they land.
      let order = 0;
      const columns = table.tableau.map((col) => [...col.down, ...col.up]);
      for (let row = 0; row < 7; row++) {
        for (let c = row; c < 7; c++) {
          const card = columns[c][row];
          if (card === undefined) continue;
          from.set(card, { x: stock.x, y: stock.y });
          delay.set(card, order++ * DEAL_STAGGER);
          faceDown.add(card);
        }
      }
    } else if (motion.kind === "move" || motion.kind === "finish") {
      motion.effects.forEach((effect, e) => {
        effect.cards.forEach((card, k) => {
          if (motion.kind === "finish") delay.set(card, e * FINISH_STAGGER);
          else if (effect.token === "s" && !effect.recycled) delay.set(card, k * DRAW_STAGGER);
          else delay.set(card, k * 14);
        });
        if (effect.flipped !== null) turnAfter = 260;
      });
    }
    return { delay, from, faceDown, turnAfter };
  }

  /** Where a card is drawn right now (mid-flight, its animated position). */
  private current(card: Card): Pos {
    const el = this.els[card];
    if (el && this.flights.has(card)) {
      const m = new DOMMatrixReadOnly(getComputedStyle(el).transform);
      return { x: m.m41, y: m.m42 };
    }
    return this.at[card] ?? { x: 0, y: 0 };
  }

  private put(card: Card, p: Pos, z: number) {
    const el = this.els[card]!;
    el.style.transform = translate(p);
    el.style.zIndex = String(z);
    this.at[card] = { x: p.x, y: p.y };
  }

  private stop(card: Card) {
    const anim = this.flights.get(card);
    if (anim) {
      this.flights.delete(card);
      anim.cancel();
    }
  }

  /** Flies a card from `from` to its place; returns the flight's length in ms. */
  private fly(card: Card, from: Pos, place: Place, delay: number): number {
    const el = this.els[card]!;
    this.stop(card);
    this.put(card, place, FLYING_Z + place.z);
    const duration = flightMs(from, place);
    // fill "backwards": a card waiting its turn in a stagger stays where it was.
    const anim = el.animate([{ transform: translate(from) }, { transform: translate(place) }], {
      duration,
      delay,
      easing: EASE,
      fill: "backwards",
    });
    this.flights.set(card, anim);
    anim.finished
      .then(() => {
        if (this.flights.get(card) !== anim) return;
        this.flights.delete(card);
        el.style.zIndex = String(this.places[card]?.z ?? place.z);
      })
      .catch(() => {});
    return duration;
  }

  /** Shows a card's face (or back): at once (`after` null), or turned over after `after` ms. */
  private face(card: Card, up: boolean, after: number | null) {
    const el = this.els[card]!;
    const want = up ? "1" : "0";
    const pending = this.flips.get(card);
    if (pending) {
      clearTimeout(pending.timer);
      pending.anim.cancel();
      this.flips.delete(card);
    }
    if (el.dataset.up === want) return;
    if (after === null || this.reduced() || el.dataset.up === undefined) {
      el.dataset.up = want;
      return;
    }
    const inner = el.firstElementChild as HTMLElement;
    const anim = inner.animate([{ transform: "scaleX(1)" }, { transform: "scaleX(0)", offset: 0.5 }, { transform: "scaleX(1)" }], {
      duration: FLIP_MS,
      delay: Math.max(0, after),
      easing: "ease-in-out",
    });
    anim.finished.catch(() => {});
    const timer = window.setTimeout(() => {
      el.dataset.up = want;
      this.flips.delete(card);
    }, Math.max(0, after) + FLIP_MS / 2);
    this.flips.set(card, { anim, timer });
  }

  /** A refused tap: the cards shake where they are. */
  shake(cards: readonly Card[]) {
    if (this.reduced()) return;
    for (const card of cards) {
      const inner = this.els[card]?.firstElementChild as HTMLElement | undefined;
      inner?.animate(
        [{ translate: "0" }, { translate: "-5px" }, { translate: "5px" }, { translate: "-3px" }, { translate: "3px" }, { translate: "0" }],
        { duration: 300, easing: "ease-in-out" },
      );
    }
  }

  /** Picks cards up: their flights stop where they are, and they rise above everything. */
  grab(cards: readonly Card[]): Pos[] {
    return cards.map((card, i) => {
      const pos = this.current(card);
      this.stop(card);
      this.held.add(card);
      const el = this.els[card]!;
      el.style.willChange = "transform";
      this.put(card, pos, HELD_Z + i);
      return pos;
    });
  }

  /** Moves held cards to `starts` shifted by (dx, dy). */
  drag(cards: readonly Card[], starts: readonly Pos[], dx: number, dy: number) {
    cards.forEach((card, i) => {
      const el = this.els[card];
      if (!el) return;
      const p = { x: starts[i].x + dx, y: starts[i].y + dy };
      el.style.transform = translate(p);
      this.at[card] = p;
    });
  }

  /** Lets go of held cards where they are: the next sync flies them on to their places. */
  release(cards: readonly Card[]) {
    for (const card of cards) {
      this.held.delete(card);
      const el = this.els[card];
      if (el) el.style.willChange = "";
    }
  }

  /** Lets go of held cards and flies them back to where they lie. */
  flyHome(cards: readonly Card[]) {
    this.release(cards);
    cards.forEach((card, i) => {
      const place = this.places[card];
      if (!place || !this.els[card]) return;
      if (this.reduced()) this.put(card, place, place.z);
      else this.fly(card, this.current(card), place, i * 14);
    });
  }

  /** Flies home any of these cards left resting away from its place (not held, not in flight). */
  settle(cards: readonly Card[]) {
    cards.forEach((card) => {
      const place = this.places[card];
      const at = this.at[card];
      if (!place || !at || this.held.has(card) || this.flights.has(card)) return;
      if (Math.abs(at.x - place.x) > 0.5 || Math.abs(at.y - place.y) > 0.5) this.fly(card, at, place, 0);
    });
  }

  /** Resolves once no card is flying. */
  async whenIdle(): Promise<void> {
    while (this.flights.size > 0) {
      await Promise.all([...this.flights.values()].map((a) => a.finished.catch(() => {})));
    }
  }
}
