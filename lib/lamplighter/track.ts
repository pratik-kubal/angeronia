// The ribbon, compiled from a route's segments: its centre line and frame every half metre.
//
// World axes: x right, y up, z ahead at the start. The centre line is integrated like a turtle
// (a heading and a pitch, stepped along at the midpoint of each half metre). The frame is guided by
// the world's up rather than minimising rotation: on a spiral that climbs at a steady pitch, a
// rotation-minimising frame slowly twists the ribbon over, and this one keeps it level. It is
// exact for a turtle that never pitches past ±60°. Every value is rounded to a millionth, so the
// same route compiles to the same numbers in any engine.

import { clamp, cross, DEG, lerp, normalize, q, smoothstep, v3, type V3 } from "./math";
import type { RouteDef, Seg } from "./route";

export const TRACK_STEP = 0.5;
const MAX_PITCH = 60;

export type Track = {
  step: number;
  /** Samples, at s = i × step. */
  n: number;
  /** (n − 1) × step. */
  length: number;
  /** Position, tangent, right and up per sample, xyz interleaved. */
  p: Float64Array;
  t: Float64Array;
  r: Float64Array;
  u: Float64Array;
  /** Half the ribbon's width (m). */
  half: Float64Array;
  /** The bank (radians, + leaning right). */
  bank: Float64Array;
  /** 1 on ribbon, 0 in a gap. */
  solid: Uint8Array;
};

type Span = { seg: Seg; from: number; to: number; yaw0: number; pitch0: number; bank0: number; half0: number };

/** Each segment with where it starts and the values it eases from. */
function spans(def: Pick<RouteDef, "start" | "segs">): Span[] {
  const out: Span[] = [];
  let at = 0;
  let yaw = 0;
  let pitch = def.start.pitch ?? 0;
  let bank = 0;
  let half = def.start.half;
  for (const seg of def.segs) {
    out.push({ seg, from: at, to: at + seg.len, yaw0: yaw, pitch0: pitch, bank0: bank, half0: half });
    at += seg.len;
    yaw += seg.yaw ?? 0;
    pitch = clamp(seg.pitch ?? pitch, -MAX_PITCH, MAX_PITCH);
    bank = seg.bank ?? bank;
    half = seg.half ?? half;
  }
  return out;
}

type Shape = { yaw: number; pitch: number; bank: number; half: number; gap: boolean };

function shapeAt(list: Span[], s: number, out: Shape, cursor: { i: number }): Shape {
  while (cursor.i < list.length - 1 && s >= list[cursor.i].to) cursor.i++;
  const sp = list[cursor.i];
  const u = clamp((s - sp.from) / sp.seg.len, 0, 1);
  const e = smoothstep(u);
  const turn = sp.seg.ease === "linear" ? u : e;
  out.yaw = sp.yaw0 + (sp.seg.yaw ?? 0) * turn;
  out.pitch = lerp(sp.pitch0, clamp(sp.seg.pitch ?? sp.pitch0, -MAX_PITCH, MAX_PITCH), e);
  out.bank = lerp(sp.bank0, sp.seg.bank ?? sp.bank0, e);
  out.half = lerp(sp.half0, sp.seg.half ?? sp.half0, e);
  out.gap = sp.seg.gap === true;
  return out;
}

function tangent(yawDeg: number, pitchDeg: number, out: V3): V3 {
  const yaw = yawDeg * DEG;
  const pitch = pitchDeg * DEG;
  out[0] = Math.cos(pitch) * Math.sin(yaw);
  out[1] = Math.sin(pitch);
  out[2] = Math.cos(pitch) * Math.cos(yaw);
  return out;
}

const WORLD_UP: V3 = [0, 1, 0];

export function compileTrack(def: Pick<RouteDef, "start" | "segs">): Track {
  const list = spans(def);
  const total = list.reduce((sum, sp) => sum + sp.seg.len, 0);
  const n = Math.round(total / TRACK_STEP) + 1;
  const track: Track = {
    step: TRACK_STEP,
    n,
    length: (n - 1) * TRACK_STEP,
    p: new Float64Array(n * 3),
    t: new Float64Array(n * 3),
    r: new Float64Array(n * 3),
    u: new Float64Array(n * 3),
    half: new Float64Array(n),
    bank: new Float64Array(n),
    solid: new Uint8Array(n),
  };

  const shape: Shape = { yaw: 0, pitch: 0, bank: 0, half: 0, gap: false };
  const mid: Shape = { yaw: 0, pitch: 0, bank: 0, half: 0, gap: false };
  const cur = { i: 0 };
  const midCur = { i: 0 };
  const pos: V3 = v3();
  const tan: V3 = v3();
  const tMid: V3 = v3();
  const up0: V3 = v3();
  const right0: V3 = v3();

  for (let i = 0; i < n; i++) {
    const s = i * TRACK_STEP;
    if (i > 0) {
      // Midpoint integration: step along the tangent half a step back.
      shapeAt(list, s - TRACK_STEP / 2, mid, midCur);
      tangent(mid.yaw, mid.pitch, tMid);
      pos[0] += tMid[0] * TRACK_STEP;
      pos[1] += tMid[1] * TRACK_STEP;
      pos[2] += tMid[2] * TRACK_STEP;
    }
    shapeAt(list, Math.min(s, total), shape, cur);
    tangent(shape.yaw, shape.pitch, tan);

    // Up, guided by the world's: the world's up less its part along the tangent. Right = up × tangent.
    const along = tan[1];
    up0[0] = WORLD_UP[0] - along * tan[0];
    up0[1] = WORLD_UP[1] - along * tan[1];
    up0[2] = WORLD_UP[2] - along * tan[2];
    normalize(up0);
    normalize(cross(up0, tan, right0));

    // Bank: lean right by turning the right edge down about the tangent.
    const b = shape.bank * DEG;
    const cb = Math.cos(b);
    const sb = Math.sin(b);
    const k = i * 3;
    for (let a = 0; a < 3; a++) {
      track.p[k + a] = q(pos[a]);
      track.t[k + a] = q(tan[a]);
      track.r[k + a] = q(right0[a] * cb - up0[a] * sb);
      track.u[k + a] = q(up0[a] * cb + right0[a] * sb);
    }
    track.half[i] = q(shape.half);
    track.bank[i] = q(b);
    // A sample on the boundary belongs to the ribbon, so a gap is exactly its authored length.
    track.solid[i] = shape.gap && s > list[cur.i].from && s < list[cur.i].to ? 0 : 1;
  }
  return track;
}

/** The sample at or before `s`, and how far past it `s` is (0..1). */
export function locate(track: Track, s: number): [number, number] {
  const x = clamp(s / track.step, 0, track.n - 1);
  const i = Math.min(Math.floor(x), track.n - 2);
  return [i, x - i];
}

/** Whether the ribbon is there at `s` (false in a gap). */
export function solidAt(track: Track, s: number): boolean {
  const [i, f] = locate(track, s);
  return track.solid[f < 0.5 ? i : i + 1] === 1;
}

/** Half the ribbon's width at `s`. */
export function halfAt(track: Track, s: number): number {
  const [i, f] = locate(track, s);
  return lerp(track.half[i], track.half[i + 1], f);
}

/** A point in the world from track coordinates: `x` right of the centre line, `h` above the ribbon. For drawing only. */
export function poseAt(track: Track, s: number, x: number, h: number, out: V3): V3 {
  const [i, f] = locate(track, s);
  const a = i * 3;
  const b = a + 3;
  for (let k = 0; k < 3; k++) {
    const p = lerp(track.p[a + k], track.p[b + k], f);
    const r = lerp(track.r[a + k], track.r[b + k], f);
    const u = lerp(track.u[a + k], track.u[b + k], f);
    out[k] = p + x * r + h * u;
  }
  return out;
}

/** The frame at `s` (tangent, right, up), interpolated and renormalised. For drawing only. */
export function frameAt(track: Track, s: number, t: V3, r: V3, u: V3): void {
  const [i, f] = locate(track, s);
  const a = i * 3;
  const b = a + 3;
  for (let k = 0; k < 3; k++) {
    t[k] = lerp(track.t[a + k], track.t[b + k], f);
    r[k] = lerp(track.r[a + k], track.r[b + k], f);
    u[k] = lerp(track.u[a + k], track.u[b + k], f);
  }
  normalize(t);
  normalize(r);
  normalize(u);
}
