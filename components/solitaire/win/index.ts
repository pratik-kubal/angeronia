import { cascade } from "./cascade";
import { fountain } from "./fountain";
import { spiral } from "./spiral";
import type { SimParams, WinSim } from "./types";
import { waterfall } from "./waterfall";

export type { SimParams, Sprite, WinSim } from "./types";
export { STEP } from "./types";

/** The win animations, played in turn: each win shows the next (storage.ts takeFx). */
export const WIN_FX = ["cascade", "fountain", "spiral", "waterfall"] as const;
export type FxKind = (typeof WIN_FX)[number];

export function createSim(kind: FxKind, params: SimParams): WinSim {
  return { cascade, fountain, spiral, waterfall }[kind](params);
}
