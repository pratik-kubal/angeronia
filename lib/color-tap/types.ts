// The shapes Color Tap's conversion produces and its screen reads. A puzzle is made once, at build
// time (scripts/build-color-tap-puzzles.ts), on a work grid whose long edge is WORK_SIZE px; every
// coordinate below is in those "work px", y down.

export type LevelId = "easy" | "medium" | "hard" | "expert" | "master";

/**
 * One border between two regions, or between a region and the outside (-1), traced once from
 * junction to junction (a point where three or more regions meet) and shared by both sides, so
 * neighbours never gap or overlap.
 */
export interface Segment {
  /** The region on its left, walking from its first point to its last (y down), or -1 outside. */
  left: number;
  /** The region on its right, or -1 outside. */
  right: number;
  /** A loop with no junction on it: the whole border of an island. */
  closed: boolean;
  /** The smoothed control polygon, x0 y0 x1 y1 …, drawn as a quadratic B-spline (geometry.ts). */
  points: Float32Array;
}

/** Where a region's number goes: a point deep inside it and the radius of the circle that fits there. */
export interface Label {
  x: number;
  y: number;
  r: number;
}

export interface Region {
  /** Its palette index; the number painted on it is `colour + 1`. */
  colour: number;
  /** Its size in work px. */
  area: number;
  /** Its bounding box: x0, y0, x1, y1 (x1 and y1 exclusive). */
  box: [number, number, number, number];
  /** The first is its main label, at its pole of inaccessibility; a long region gets a few more. */
  labels: Label[];
  /**
   * Its borders, as half-segment references: `2s` walks segment `s` forwards, `2s + 1` backwards,
   * with the region on the left either way. The first ring is the outer one, any others are holes.
   */
  rings: number[][];
}

/** A picture in the generated manifest (lib/color-tap/pictures.ts). */
export interface PictureInfo {
  id: string;
  title: string;
  /** The photo itself. */
  src: string;
  /** A small copy of it for the picker. */
  thumb: string;
  width: number;
  height: number;
  levels: PictureLevel[];
}

export interface PictureLevel {
  level: LevelId;
  /** The colours and areas it really has (near-duplicate colours merge, so it may be a few short). */
  colours: number;
  areas: number;
  /** Mean OKLab distance from the photo to the finished painting: it falls level by level. */
  deltaE: number;
  /** The puzzle file's URL. */
  src: string;
  /** The puzzle's id, so a save knows which puzzle it was made on. */
  id: string;
  /** What it was made from: the photo, the level's settings and the pipeline version, hashed. */
  key: string;
  /**
   * Earlier puzzles of this picture at this level, still served (each beside the current one, at
   * the same name with its own id), so a painting begun on one is finished on it: a remade puzzle
   * never takes a player's progress away.
   */
  retired: RetiredPuzzle[];
}

export interface RetiredPuzzle {
  id: string;
  /** Its own area count, so a painting finished on it reads as finished. */
  areas: number;
}

export interface Puzzle {
  /** A hash of the puzzle file, so a save can tell its puzzle from a regenerated one. */
  id: string;
  /** The picture's id: its file name without the extension. */
  picture: string;
  level: LevelId;
  width: number;
  height: number;
  /** The colours, "#rrggbb", in number order. */
  palette: string[];
  regions: Region[];
  segments: Segment[];
}
