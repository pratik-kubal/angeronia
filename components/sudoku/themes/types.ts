// What a theme brings to the screen (its definition, copy and secrets are pure, in
// lib/sudoku/themes/). A theme is a folder here: <id>.css (its colour tokens for both schemes, plus
// its scene's styles, imported by app/sudoku/page.tsx), and optionally a Backdrop, an Overlay and
// a voice, registered in index.ts.

import type { ComponentType } from "react";
import type { Unit } from "@/lib/sudoku/grid";
import type { Voice } from "../feedback";

/** The game's latest beat, for a scene's ambient reactions; a new token is a new beat. */
export type Beat =
  | { token: number; kind: "deal" }
  | { token: number; kind: "place" | "hint" | "win"; cell: number; digit: number; units: readonly Unit[]; digitDone: boolean }
  | { token: number; kind: "miss"; cell: number; digit: number };

/** A surprise to play now: a secret's (its `surprise`) or "arrive" (Seasonal brought the theme in). A new token replays it. */
export type Cue = { token: number; surprise: string };

export type SceneProps = {
  /** The finished 3×3 boxes, box b (0 top-left, in reading order) as bit b. */
  boxes: number;
  /** How full the board is, 0 to 1 (clues included). */
  filled: number;
  beat: Beat | null;
  cue: Cue | null;
};

export type Skin = {
  /**
   * Drawn behind the game, over the page's ground: the gutters, the gaps and behind the glassy
   * controls. A tap on a piece marked data-tap="<name>" is a secret's "scene" moment (target <name>).
   */
  Backdrop?: ComponentType<SceneProps>;
  /** Drawn over the game (never takes a tap): for surprises that cross the screen. */
  Overlay?: ComponentType<SceneProps>;
  voice?: Partial<Voice>;
};
