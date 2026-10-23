// The win animations: pure simulations stepped at a fixed 60 Hz (so a trail's spacing never
// depends on the frame rate), drawn by win-canvas.tsx. Each starts from the four foundations,
// where the won game left the cards.

import type { Card } from "@/lib/solitaire/cards";

/** One card drawn this step, centred at (x, y), turned `rot` radians. */
export type Sprite = { card: Card; x: number; y: number; rot: number };

export type SimParams = {
  width: number;
  height: number;
  cardW: number;
  cardH: number;
  /** The four foundations' centres, in suit order. */
  foundations: { x: number; y: number }[];
  seed: number;
};

export interface WinSim {
  /** False keeps every frame on the canvas (the cascade's trails). */
  readonly clears: boolean;
  /** Advances one step of 1/60 s: the cards to draw, or null once it's over. */
  step(): Sprite[] | null;
}

export const STEP = 1 / 60;
