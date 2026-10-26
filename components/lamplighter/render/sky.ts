// The night around the ribbon: a sky graded from the zenith to a misty horizon, far hills with a
// few warm windows, stars and the moon. Nothing here is a big offscreen picture (WebKit caps
// canvas memory): the gradient and the hills are made once per screen size and drawn in the
// horizon's own frame, so they tilt with the camera's roll; stars and the moon are directions,
// projected like anything else.

import { mulberry32 } from "@/lib/random";
import type { Camera } from "./project";
import type { Atlas } from "./sprites";

const STARS = 150;

export type Sky = {
  /** Star directions (x, y, z) with a size and a twinkle phase, 5 numbers each. */
  stars: Float64Array;
  moon: [number, number, number];
  grad: CanvasGradient;
  hills: Path2D;
  /** Window lights on the hills: x, y in the horizon's frame, 2 numbers each. */
  windows: Float64Array;
  /** One turn of the view, in pixels: the hills repeat at this period. */
  period: number;
  /** Half the screen's diagonal: how far every fill must reach. */
  reach: number;
};

export function createSky(ctx: CanvasRenderingContext2D, cam: Pick<Camera, "f" | "w" | "h">, moon: number, seed: number): Sky {
  const rng = mulberry32(seed);
  const stars = new Float64Array(STARS * 5);
  for (let i = 0; i < STARS; i++) {
    const az = rng() * Math.PI * 2;
    // More stars up high, none in the horizon's mist.
    const el = Math.asin(0.08 + rng() * 0.9);
    stars.set([Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az), 0.6 + rng() * rng() * 1.8, rng() * Math.PI * 2], i * 5);
  }
  const mAz = (moon - 0.5) * 1.4;
  const mEl = 0.38;
  const moonDir: [number, number, number] = [Math.cos(mEl) * Math.sin(mAz), Math.sin(mEl), Math.cos(mEl) * Math.cos(mAz)];

  const reach = Math.hypot(cam.w, cam.h);
  const grad = ctx.createLinearGradient(0, -reach, 0, reach);
  grad.addColorStop(0, "#03051a");
  grad.addColorStop(0.3, "#0a1038");
  grad.addColorStop(0.47, "#1c2560");
  grad.addColorStop(0.5, "#2c3672");
  grad.addColorStop(0.52, "#1a2154");
  grad.addColorStop(0.7, "#0b1030");
  grad.addColorStop(1, "#05071a");

  // Rolling hills over one full turn, so they wrap seamlessly as the ribbon turns.
  const period = Math.PI * 2 * cam.f;
  const hills = new Path2D();
  const windows: number[] = [];
  const steps = 96;
  const height = cam.h * 0.05;
  const phase = rng() * 10;
  hills.moveTo(0, reach);
  for (let k = 0; k <= steps; k++) {
    const u = k / steps;
    const a = u * Math.PI * 2;
    const y = -height * (0.45 + 0.3 * Math.sin(a * 3 + phase) + 0.2 * Math.sin(a * 7 + phase * 2) + 0.05 * Math.sin(a * 17));
    hills.lineTo(u * period, y);
    if (rng() < 0.35) windows.push(u * period + rng() * (period / steps), y + 2 + rng() * height * 0.4);
  }
  hills.lineTo(period, reach);
  hills.closePath();
  return { stars, moon: moonDir, grad, hills, windows: Float64Array.from(windows), period, reach };
}

/** A direction's place on screen, or null behind the camera. */
function dirToScreen(cam: Camera, d: ArrayLike<number>, out: { x: number; y: number }): boolean {
  const z = cam.fwd[0] * d[0] + cam.fwd[1] * d[1] + cam.fwd[2] * d[2];
  if (z <= 0.02) return false;
  const x = cam.right[0] * d[0] + cam.right[1] * d[1] + cam.right[2] * d[2];
  const y = cam.up[0] * d[0] + cam.up[1] * d[1] + cam.up[2] * d[2];
  out.x = cam.w / 2 + (cam.f * x) / z;
  out.y = cam.h / 2 - (cam.f * y) / z;
  return true;
}

const pt = { x: 0, y: 0 };
const pt2 = { x: 0, y: 0 };

export function drawSky(ctx: CanvasRenderingContext2D, sky: Sky, cam: Camera, atlas: Atlas, t: number, twinkle: boolean) {
  // The horizon: straight ahead, level, and a little either side of it.
  let hx = cam.fwd[0];
  let hz = cam.fwd[2];
  const hl = Math.hypot(hx, hz) || 1;
  hx /= hl;
  hz /= hl;
  const yaw = Math.atan2(hx, hz);
  let cx = cam.w / 2;
  let cy = cam.h / 2;
  let angle = 0;
  if (dirToScreen(cam, [hx, 0, hz], pt)) {
    cx = pt.x;
    cy = pt.y;
    const c = Math.cos(0.3);
    const s = Math.sin(0.3);
    if (dirToScreen(cam, [hx * c + hz * s, 0, hz * c - hx * s], pt2)) angle = Math.atan2(pt2.y - pt.y, pt2.x - pt.x);
  }

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.fillStyle = sky.grad;
  ctx.fillRect(-sky.reach * 1.5, -sky.reach * 1.5, sky.reach * 3, sky.reach * 3);
  // Hills: far enough that they slide only as the view turns.
  let off = (-yaw * cam.f) % sky.period;
  if (off > 0) off -= sky.period;
  ctx.fillStyle = "#0a0f32";
  for (let o = off - sky.period; o < sky.reach; o += sky.period) {
    if (o + sky.period < -sky.reach) continue;
    ctx.save();
    ctx.translate(o, 0);
    ctx.fill(sky.hills);
    ctx.restore();
  }
  ctx.fillStyle = "#e9b85a";
  for (let o = off - sky.period; o < sky.reach; o += sky.period) {
    for (let i = 0; i < sky.windows.length; i += 2) {
      const x = o + sky.windows[i];
      if (x < -sky.reach || x > sky.reach) continue;
      ctx.fillRect(x, sky.windows[i + 1], 1.5, 1.5);
    }
  }
  ctx.restore();

  // Stars.
  ctx.fillStyle = "#e8ecff";
  for (let i = 0; i < sky.stars.length; i += 5) {
    if (!dirToScreen(cam, sky.stars.subarray(i, i + 3), pt)) continue;
    if (pt.x < -4 || pt.y < -4 || pt.x > cam.w + 4 || pt.y > cam.h + 4) continue;
    const size = sky.stars[i + 3];
    ctx.globalAlpha = twinkle ? 0.55 + 0.45 * Math.sin(t * (1.3 + size) + sky.stars[i + 4]) : 0.8;
    ctx.fillRect(pt.x - size / 2, pt.y - size / 2, size, size);
  }
  ctx.globalAlpha = 1;

  // The moon.
  if (dirToScreen(cam, sky.moon, pt)) {
    const cell = atlas.cells.moon;
    const size = cam.h * 0.22;
    ctx.drawImage(atlas.canvas, cell.x, cell.y, cell.w, cell.h, pt.x - size / 2, pt.y - size / 2, size, size);
  }
}
