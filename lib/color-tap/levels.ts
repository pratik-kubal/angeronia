// The five levels. A level is a number of colours and the smallest area a player is asked to find
// and tap: more colours and smaller areas paint a picture closer to the photo. Every size is in
// work px on a grid whose long edge is WORK_SIZE (800 px, so 0.49 CSS px each on an iPhone held
// upright, before zooming in).

import type { LevelId } from "./types";

/**
 * Bump it whenever the conversion changes what it produces: every puzzle is made again, and the old
 * ones stay as retired puzzles, so paintings already begun carry on on the puzzle they began on.
 */
export const PIPELINE_VERSION = 1;

/** The long edge of the work grid, in px. */
export const WORK_SIZE = 800;

export interface Level {
  id: LevelId;
  name: string;
  /** How many colours k-means is asked for; near-duplicates merge, so a picture may show a few fewer. */
  colours: number;
  /** Bilateral smoothing passes before the colours are found: flatter, friendlier shapes on easy levels. */
  passes: number;
  /** The smallest area kept, in work px². */
  minArea: number;
  /** The smallest inscribed radius kept, in work px: no area is thinner than twice this. */
  minRadius: number;
  /** The most areas a picture may have at this level; past it the two floors rise until it fits. */
  maxAreas: number;
  /** Two colours closer than this (OKLab ΔE) are one colour: a player couldn't tell their swatches apart. */
  minDistance: number;
  /** How many times the magnifier can be used on one painting. */
  magnifiers: number;
}

export const LEVELS: readonly Level[] = [
  { id: "easy", name: "Easy", colours: 12, passes: 2, minArea: 220, minRadius: 5, maxAreas: 260, minDistance: 0.055, magnifiers: 3 },
  { id: "medium", name: "Medium", colours: 20, passes: 2, minArea: 130, minRadius: 4, maxAreas: 480, minDistance: 0.042, magnifiers: 4 },
  { id: "hard", name: "Hard", colours: 30, passes: 1, minArea: 75, minRadius: 3.25, maxAreas: 850, minDistance: 0.033, magnifiers: 5 },
  { id: "expert", name: "Expert", colours: 45, passes: 1, minArea: 48, minRadius: 2.7, maxAreas: 1350, minDistance: 0.026, magnifiers: 6 },
  { id: "master", name: "Master", colours: 60, passes: 1, minArea: 30, minRadius: 2.25, maxAreas: 2100, minDistance: 0.022, magnifiers: 8 },
];

export const LEVEL_IDS: readonly LevelId[] = LEVELS.map((level) => level.id);

export function isLevelId(value: unknown): value is LevelId {
  return typeof value === "string" && (LEVEL_IDS as readonly string[]).includes(value);
}

export function levelById(id: LevelId): Level {
  const level = LEVELS.find((l) => l.id === id);
  if (!level) throw new Error(`Unknown level ${id}`);
  return level;
}
