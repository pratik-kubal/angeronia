// The chase camera: behind Wick and above, looking a little down the ribbon. It follows the ribbon
// itself (sampled six metres back along it, not cut straight through the air), so on the Bell
// Tower's spiral it circles with Wick instead of passing through the tower. It leans with the
// ribbon's bank, less under reduced motion, plus any roll the view asks for (the tilt mode's level
// horizon). Pure: the same inputs give the same camera.

import { clamp, cross, DEG, lerp, normalize, v3, type V3 } from "@/lib/lamplighter/math";
import { locate, poseAt, type Track } from "@/lib/lamplighter/track";
import type { Camera } from "./project";

/** How far behind Wick the camera rides, how high, and how far ahead it looks (m). */
export const BEHIND = 7;
export const ABOVE = 3.1;
export const AHEAD = 12;
/** The camera leans this share of the ribbon's bank. */
export const BANK_SHARE = 0.6;
export const MAX_ROLL = 35 * DEG;

export type Pose = { s: number; x: number; h: number };
export type CameraOptions = {
  /** The screen's size in CSS pixels. */
  w: number;
  h: number;
  /** Extra roll, in radians (the level horizon in tilt mode). */
  viewRoll: number;
  reduced: boolean;
  /** Seconds since the last camera, for smoothing; 0 snaps. */
  dt: number;
};

/** Vertical field of view: wider upright, so the ribbon ahead still fits a narrow screen. */
export function fovFor(aspect: number): number {
  const t = clamp((aspect - 0.5) / (1.6 - 0.5), 0, 1);
  return lerp(78, 52, t) * DEG;
}

const WORLD_UP: V3 = [0, 1, 0];
/** How quickly the camera catches up with where it should be (1/s). */
const FOLLOW = 9;

/** A point on the ribbon, or before its start: straight back along its first heading. */
function behind(track: Track, s: number, x: number, h: number): V3 {
  const p = poseAt(track, Math.max(0, s), x, h, v3());
  if (s < 0) for (let k = 0; k < 3; k++) p[k] += track.t[k] * s;
  return p;
}

export function cameraAt(track: Track, pose: Pose, opts: CameraOptions, prev: Camera | null): Camera {
  const eyeGoal = behind(track, pose.s - BEHIND, pose.x * 0.6, ABOVE + Math.max(0, pose.h) * 0.5);
  const lookGoal = poseAt(track, pose.s + AHEAD, pose.x * 0.8, 0, v3());

  const keep = prev && opts.dt > 0 ? Math.exp(-FOLLOW * opts.dt) : 0;
  const eye = prev ? v3() : eyeGoal;
  if (prev) for (let k = 0; k < 3; k++) eye[k] = lerp(eyeGoal[k], prev.eye[k], keep);
  const fwd = normalize([lookGoal[0] - eye[0], lookGoal[1] - eye[1], lookGoal[2] - eye[2]]);
  const right0 = normalize(cross(WORLD_UP, fwd));
  const up0 = cross(fwd, right0);

  const [i, f] = locate(track, pose.s);
  const bank = lerp(track.bank[i], track.bank[i + 1], f);
  const goal = clamp((opts.reduced ? 0 : bank * BANK_SHARE) + opts.viewRoll, -MAX_ROLL, MAX_ROLL);
  const roll = prev ? lerp(goal, prev.roll, keep) : goal;
  const c = Math.cos(roll);
  const s = Math.sin(roll);
  const right: V3 = [right0[0] * c - up0[0] * s, right0[1] * c - up0[1] * s, right0[2] * c - up0[2] * s];
  const up: V3 = [up0[0] * c + right0[0] * s, up0[1] * c + right0[1] * s, up0[2] * c + right0[2] * s];

  const fov = fovFor(opts.w / opts.h);
  return { eye, fwd, right, up, f: opts.h / 2 / Math.tan(fov / 2), w: opts.w, h: opts.h, roll };
}
