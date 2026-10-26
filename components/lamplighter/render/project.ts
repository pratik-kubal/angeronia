// The camera's projection: world points to screen pixels, and polygons clipped at the near plane
// first, so a quad that runs past the camera is cut rather than flipped. The technique is the hero
// Möbius's (components/site/mobius-figure.tsx), copied here so the game imports nothing from the
// site (DECISIONS.md ADR-019, ADR-022).

import type { V3 } from "@/lib/lamplighter/math";

export type Camera = {
  eye: V3;
  /** Unit vectors: where it looks, its right and its up (already rolled). */
  fwd: V3;
  right: V3;
  up: V3;
  /** Focal length in CSS pixels, and the screen's size in CSS pixels. */
  f: number;
  w: number;
  h: number;
  /** How far the camera is rolled from level (radians, + leaning right). */
  roll: number;
};

/** Nothing nearer than this is drawn (m). */
export const NEAR = 0.3;

/** A point in camera space: across (right), up, and depth along the view. */
export function toCamera(cam: Camera, p: Readonly<V3>, out: V3): V3 {
  const rx = p[0] - cam.eye[0];
  const ry = p[1] - cam.eye[1];
  const rz = p[2] - cam.eye[2];
  out[0] = cam.right[0] * rx + cam.right[1] * ry + cam.right[2] * rz;
  out[1] = cam.up[0] * rx + cam.up[1] * ry + cam.up[2] * rz;
  out[2] = cam.fwd[0] * rx + cam.fwd[1] * ry + cam.fwd[2] * rz;
  return out;
}

/** Screen x and y of a camera-space point in front of the near plane. */
export const screenX = (cam: Camera, c: Readonly<V3>) => cam.w / 2 + (cam.f * c[0]) / c[2];
export const screenY = (cam: Camera, c: Readonly<V3>) => cam.h / 2 - (cam.f * c[1]) / c[2];

/** Projects a world point; returns its depth, or 0 if it is behind the near plane. */
export function project(cam: Camera, p: Readonly<V3>, out: { x: number; y: number }, tmp: V3): number {
  toCamera(cam, p, tmp);
  if (tmp[2] <= NEAR) return 0;
  out.x = screenX(cam, tmp);
  out.y = screenY(cam, tmp);
  return tmp[2];
}

/**
 * Clips a camera-space polygon (xyz triples in `pts`, `n` corners) against the near plane and
 * writes its screen corners into `out` (xy pairs). Returns how many corners are left (0 if it is
 * wholly behind). Sutherland–Hodgman against one plane.
 */
export function clipToScreen(cam: Camera, pts: Float64Array, n: number, out: Float64Array): number {
  let k = 0;
  for (let i = 0; i < n; i++) {
    const a = i * 3;
    const b = ((i + 1) % n) * 3;
    const za = pts[a + 2];
    const zb = pts[b + 2];
    const ina = za > NEAR;
    const inb = zb > NEAR;
    if (ina) {
      out[k++] = cam.w / 2 + (cam.f * pts[a]) / za;
      out[k++] = cam.h / 2 - (cam.f * pts[a + 1]) / za;
    }
    if (ina !== inb) {
      const t = (NEAR - za) / (zb - za);
      const x = pts[a] + (pts[b] - pts[a]) * t;
      const y = pts[a + 1] + (pts[b + 1] - pts[a + 1]) * t;
      out[k++] = cam.w / 2 + (cam.f * x) / NEAR;
      out[k++] = cam.h / 2 - (cam.f * y) / NEAR;
    }
  }
  return k / 2;
}
