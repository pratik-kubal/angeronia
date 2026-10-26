// One frame of the race on a 2D canvas: the sky, then the ribbon and everything on it, far to near,
// then the lights. The ribbon is cut into cross-sections along the view; each pair makes a quad
// (a bright edge band either side of a silk-blue middle), shaded by the moon, warmed near Wick,
// fogged with distance. Quads and sprites share one draw list sorted by depth (painter's order), so
// a crest hides what is past it and a higher loop of the spiral passes over a lower one. The list,
// the cross-sections and the particles are allocated once; a frame allocates nothing but colour
// strings it hasn't seen yet.

import type { Compiled } from "@/lib/lamplighter/compiled";
import { clamp, lerp, v3, type V3 } from "@/lib/lamplighter/math";
import { THREAD_H } from "@/lib/lamplighter/rules";
import { batAt, rainLanding, type EventKind, type Sim } from "@/lib/lamplighter/sim";
import { halfAt, poseAt } from "@/lib/lamplighter/track";
import type { Pose } from "./camera";
import { createParticles, emit, setCap, update, type Particles } from "./particles";
import { clipToScreen, toCamera, type Camera } from "./project";
import type { Tier } from "./quality";
import { createSky, drawSky, type Sky } from "./sky";
import { buildAtlas, type Atlas, type SpriteName } from "./sprites";

/** Wick and the things on the ribbon float this far above it (m). */
export const HOVER = 0.35;
/** The ribbon's bright edge band (m). */
const BAND = 0.18;
const BEHIND = 5;
const MAX_SECTIONS = 200;
const MAX_ENTRIES = 1200;

const enum Kind {
  Quad,
  Item,
  Wick,
  Lamp,
  Lantern,
  Prop,
}

export type FrameView = {
  cam: Camera;
  sim: Sim;
  /** Wick's pose, between the last two ticks. */
  pose: Pose;
  /** The simulation's tick, with the fraction since it: for things that move by the tick. */
  tick: number;
  /** Seconds of real time, and since the last frame: for wings, twinkles and particles. */
  t: number;
  dt: number;
  tier: Tier;
  reduced: boolean;
  /** Seconds since the lantern was lit, or −1. */
  lit: number;
};

export type Scene = {
  resize(w: number, h: number, dpr: number, cam: Camera): void;
  render(view: FrameView): void;
  burst(kind: EventKind, item: number, sim: Sim): void;
  destroy(): void;
};

const LIGHT = (() => {
  const l = [0.3, 1, -0.35];
  const n = Math.hypot(l[0], l[1], l[2]);
  return l.map((v) => v / n);
})();
const FOG: [number, number, number] = [38, 48, 106];
const SILK: [number, number, number] = [92, 108, 196];
const EDGE: [number, number, number] = [205, 218, 255];
const WARM: [number, number, number] = [255, 196, 92];

export function createScene(canvas: HTMLCanvasElement, route: Compiled, seed: number): Scene {
  const ctx = canvas.getContext("2d", { alpha: false })!;
  const atlas: Atlas = buildAtlas();
  const particles: Particles = createParticles(seed);
  const track = route.track;
  let sky: Sky | null = null;
  let dpr = 1;

  // The ground the scenery stands on, well below the lowest stretch of ribbon.
  let lowest = Infinity;
  for (let i = 0; i < track.n; i++) lowest = Math.min(lowest, track.p[i * 3 + 1]);
  const groundY = lowest - 9;

  // Cross-sections: four points across (outer left, inner left, inner right, outer right), in camera space.
  const sect = new Float64Array(MAX_SECTIONS * 12);
  const sectS = new Float64Array(MAX_SECTIONS);
  const sectShade = new Float64Array(MAX_SECTIONS);
  // The draw list.
  const dz = new Float64Array(MAX_ENTRIES);
  const dk = new Uint8Array(MAX_ENTRIES);
  const di = new Int32Array(MAX_ENTRIES);
  const order = new Int32Array(MAX_ENTRIES);
  let count = 0;

  const quad = new Float64Array(12);
  const screen = new Float64Array(16);
  const tmp: V3 = v3();
  const world: V3 = v3();
  const cpt: V3 = v3();
  const colors = new Map<number, string>();

  function color(r: number, g: number, b: number): string {
    const key = ((clamp(r, 0, 255) >> 2) << 12) | ((clamp(g, 0, 255) >> 2) << 6) | (clamp(b, 0, 255) >> 2);
    let s = colors.get(key);
    if (!s) colors.set(key, (s = `rgb(${(key >> 12) << 2},${((key >> 6) & 63) << 2},${(key & 63) << 2})`));
    return s;
  }

  function push(z: number, kind: Kind, idx: number) {
    if (count >= MAX_ENTRIES) return;
    dz[count] = z;
    dk[count] = kind;
    di[count] = idx;
    order[count] = count;
    count++;
  }
  /** Far (large depth) first. */
  const farFirst = (a: number, b: number) => dz[b] - dz[a];

  /** Depth of a world point (0 if behind). */
  function depth(cam: Camera, p: V3): number {
    toCamera(cam, p, cpt);
    return cpt[2];
  }

  let blend: GlobalCompositeOperation = "source-over";
  function mode(m: GlobalCompositeOperation) {
    if (blend !== m) ctx.globalCompositeOperation = blend = m;
  }

  /** Draws a sprite centred on a world point, `size` metres across (its height follows its cell). */
  function sprite(cam: Camera, name: SpriteName, p: V3, size: number, alpha = 1, anchorBottom = false, squash = 1) {
    toCamera(cam, p, cpt);
    if (cpt[2] <= 0.3) return;
    const cell = atlas.cells[name];
    const w = (size * cam.f) / cpt[2];
    if (w < 0.5) return;
    const h = (w * cell.h * squash) / cell.w;
    const x = cam.w / 2 + (cam.f * cpt[0]) / cpt[2];
    const y = cam.h / 2 - (cam.f * cpt[1]) / cpt[2];
    if (x + w < 0 || x - w > cam.w || y + h < 0 || y - h > cam.h) return;
    ctx.globalAlpha = alpha;
    ctx.drawImage(atlas.canvas, cell.x, cell.y, cell.w, cell.h, x - w / 2, anchorBottom ? y - h : y - h / 2, w, h);
  }

  function fogAlpha(z: number, far: number) {
    return 1 - clamp((z - far * 0.7) / (far * 0.3), 0, 1);
  }

  function drawQuad(cam: Camera, k: number, view: FrameView) {
    const a = k * 12;
    const b = a + 12;
    const z = (sect[a + 2] + sect[a + 11] + sect[b + 2] + sect[b + 11]) / 4;
    const fog = Math.pow(clamp((z - 25) / (view.tier.far - 25), 0, 1), 1.2);
    const shade = sectShade[k];
    const s = sectS[k];
    const stripe = Math.floor(s / 2) % 2 === 0 ? 1 : 0.9;
    // Wick's light on the ribbon: warm within a few metres, more with more glow.
    const near = Math.max(0, 1 - Math.abs(s - view.pose.s - 0.5) / 5);
    const warm = near * near * clamp(view.sim.glow / 120, 0.25, 1) * (view.sim.dip ? 0.3 : 1);
    for (let band = 0; band < 3; band++) {
      const base = band === 1 ? SILK : EDGE;
      const lit = band === 1 ? shade * stripe : 0.75 + shade * 0.25;
      const w = band === 1 ? warm * 0.55 : warm * 0.2;
      const r = lerp(lerp(base[0] * lit, WARM[0], w), FOG[0], fog);
      const g = lerp(lerp(base[1] * lit, WARM[1], w), FOG[1], fog);
      const bl = lerp(lerp(base[2] * lit, WARM[2], w), FOG[2], fog);
      ctx.fillStyle = color(r, g, bl);
      const i0 = band;
      const i1 = band + 1;
      quad.set([sect[a + i0 * 3], sect[a + i0 * 3 + 1], sect[a + i0 * 3 + 2], sect[a + i1 * 3], sect[a + i1 * 3 + 1], sect[a + i1 * 3 + 2]], 0);
      quad.set([sect[b + i1 * 3], sect[b + i1 * 3 + 1], sect[b + i1 * 3 + 2], sect[b + i0 * 3], sect[b + i0 * 3 + 1], sect[b + i0 * 3 + 2]], 6);
      const n = clipToScreen(cam, quad, 4, screen);
      if (n < 3) continue;
      ctx.beginPath();
      ctx.moveTo(screen[0], screen[1]);
      for (let p = 1; p < n; p++) ctx.lineTo(screen[p * 2], screen[p * 2 + 1]);
      ctx.closePath();
      ctx.fill();
    }
  }

  function drawItem(cam: Camera, j: number, view: FrameView) {
    const it = route.items[j];
    const far = view.tier.far;
    switch (it.kind) {
      case "spark":
      case "big": {
        const bob = view.reduced ? 0 : 0.08 * Math.sin(view.t * 3 + j);
        poseAt(track, it.s, it.x, it.h + HOVER + bob, world);
        const a = fogAlpha(depth(cam, world), far);
        const big = it.kind === "big";
        mode("lighter");
        sprite(cam, "glow", world, big ? 1.8 : 0.9, a * 0.45);
        sprite(cam, big ? "big" : "spark", world, big ? 0.8 : 0.42, a * 0.9);
        break;
      }
      case "blossom":
      case "dew": {
        poseAt(track, it.s, it.x, HOVER + 0.15, world);
        const a = fogAlpha(depth(cam, world), far);
        mode("lighter");
        sprite(cam, it.kind === "dew" ? "cool" : "glow", world, 1.6, a * 0.5);
        mode("source-over");
        sprite(cam, it.kind, world, 0.8, a);
        break;
      }
      case "rain": {
        // A shadow that grows as the drop falls, then the drop.
        const fall = Math.min(it.a, 50);
        const since = (((view.tick - it.b) % it.a) + it.a) % it.a;
        const until = it.a - since;
        const landing = rainLanding(it, Math.floor(view.tick));
        const progress = landing ? 1 : until <= fall ? 1 - until / fall : 0;
        poseAt(track, it.s, it.x, 0.03, world);
        const a = fogAlpha(depth(cam, world), far);
        mode("source-over");
        if (progress > 0) sprite(cam, "shadow", world, 0.4 + 1.4 * progress, a * (0.4 + 0.6 * progress), false, 0.45);
        if (progress > 0 && !landing) {
          poseAt(track, it.s, it.x, HOVER + 6 * (1 - progress) * (1 - progress), world);
          sprite(cam, "drop", world, 0.25, a);
        } else if (landing) {
          poseAt(track, it.s, it.x, HOVER, world);
          mode("lighter");
          sprite(cam, "cool", world, 1.6, a * 0.6);
        }
        break;
      }
      case "thread": {
        const y = HOVER + THREAD_H - 0.35;
        const taken = view.sim.taken[j] === 1;
        ctx.globalAlpha = fogAlpha(depth(cam, poseAt(track, it.s, it.x, y, world)), far) * (taken ? 0.35 : 0.9);
        mode("source-over");
        ctx.strokeStyle = "#dfe6ff";
        ctx.lineWidth = Math.max(1, (0.04 * cam.f) / Math.max(1, depth(cam, world)));
        ctx.beginPath();
        let started = false;
        for (let k = 0; k <= 8; k++) {
          const u = k / 8;
          const sag = taken ? 0.5 : 0.12 * Math.sin(u * Math.PI);
          poseAt(track, it.s, it.x - it.r + 2 * it.r * u, y - sag, world);
          toCamera(cam, world, cpt);
          if (cpt[2] <= 0.3) continue;
          const sx = cam.w / 2 + (cam.f * cpt[0]) / cpt[2];
          const sy = cam.h / 2 - (cam.f * cpt[1]) / cpt[2];
          if (started) ctx.lineTo(sx, sy);
          else ctx.moveTo(sx, sy);
          started = true;
        }
        ctx.stroke();
        if (!taken) {
          mode("lighter");
          for (const u of [0.2, 0.55, 0.8]) {
            poseAt(track, it.s, it.x - it.r + 2 * it.r * u, y - 0.12 * Math.sin(u * Math.PI), world);
            sprite(cam, "cool", world, 0.35, 0.8);
          }
        }
        break;
      }
      case "bat": {
        const tick = Math.max(it.c, view.tick);
        const bat = batAt(it, tick);
        poseAt(track, it.s, bat.x, bat.h + HOVER, world);
        const a = fogAlpha(depth(cam, world), far);
        mode("source-over");
        sprite(cam, Math.floor(view.t * 8 + j) % 2 === 0 ? "bat0" : "bat1", world, 1.5, a);
        break;
      }
    }
  }

  function drawWick(cam: Camera, view: FrameView) {
    const { pose, sim } = view;
    poseAt(track, pose.s, pose.x, pose.h + HOVER, world);
    const glow = clamp(sim.glow / 150, 0, 1);
    const flicker = view.reduced ? 1 : 0.92 + 0.08 * Math.sin(view.t * 17);
    mode("lighter");
    sprite(cam, "glow", world, (1.3 + glow * 2.2) * flicker, 0.5 + glow * 0.3);
    mode("source-over");
    const beat = Math.floor(view.t * 30) % 3;
    sprite(cam, beat === 0 ? "wick0" : beat === 1 ? "wick1" : "wick2", world, 1);
    mode("lighter");
    poseAt(track, pose.s, pose.x, pose.h + HOVER - 0.14, world);
    sprite(cam, "glow", world, 0.6, 0.7);
    if (sim.shield) {
      mode("source-over");
      poseAt(track, pose.s, pose.x, pose.h + HOVER, world);
      sprite(cam, "dew", world, 1.5, 0.55);
    }
  }

  function drawLamp(cam: Camera, k: number, view: FrameView) {
    const s = route.lamps[k];
    const side = k % 2 === 0 ? 1 : -1;
    poseAt(track, s, side * (halfAt(track, s) + 0.9), 1.3, world);
    const lit = view.sim.lamp >= k;
    const a = fogAlpha(depth(cam, world), view.tier.far);
    if (lit) {
      mode("lighter");
      sprite(cam, "glow", world, 3, a);
    }
    mode("source-over");
    sprite(cam, lit ? "lampOn" : "lampOff", world, 0.8, a);
  }

  function drawLantern(cam: Camera, view: FrameView) {
    poseAt(track, track.length - 3, 0, 3.4, world);
    const z = depth(cam, world);
    const a = Math.max(0.35, fogAlpha(z, view.tier.far * 1.6));
    if (view.lit >= 0) {
      const grow = view.reduced ? 1 : clamp(view.lit / 1.2, 0, 1);
      const bright = 0.4 + 0.6 * clamp(view.sim.glow / Math.max(1, route.maxGlow * 0.8), 0, 1);
      mode("lighter");
      sprite(cam, "glow", world, (3 + 9 * bright) * grow, a);
    }
    mode("source-over");
    sprite(cam, view.lit >= 0 ? "lanternOn" : "lanternOff", world, 2.4, a);
  }

  function drawProp(cam: Camera, k: number, view: FrameView) {
    const prop = route.def.look.props[k];
    poseAt(track, prop.s, prop.x, 0, world);
    world[1] = groundY;
    const scale = prop.scale ?? 1;
    const a = fogAlpha(depth(cam, world), view.tier.far * 1.3);
    mode("source-over");
    switch (prop.kind) {
      case "tree":
        sprite(cam, "tree", world, 5 * scale, a, true);
        break;
      case "cottage":
        sprite(cam, "cottage", world, 7 * scale, a, true);
        break;
      case "windmill": {
        sprite(cam, "windmill", world, 6 * scale, a, true);
        world[1] += 8.5 * scale;
        const cell = atlas.cells.blades;
        toCamera(cam, world, cpt);
        if (cpt[2] > 0.3) {
          const size = (7 * scale * cam.f) / cpt[2];
          ctx.save();
          ctx.globalAlpha = a;
          ctx.translate(cam.w / 2 + (cam.f * cpt[0]) / cpt[2], cam.h / 2 - (cam.f * cpt[1]) / cpt[2]);
          ctx.rotate(view.reduced ? 0 : view.t * 0.8);
          ctx.drawImage(atlas.canvas, cell.x, cell.y, cell.w, cell.h, -size / 2, -size / 2, size, size);
          ctx.restore();
        }
        break;
      }
      case "belfry":
        sprite(cam, "belfry", world, 9 * scale, a, true);
        break;
    }
  }

  function drawParticles(cam: Camera) {
    mode("lighter");
    for (let i = 0; i < particles.cap; i++) {
      const life = particles.life[i];
      if (life <= 0) continue;
      world[0] = particles.x[i];
      world[1] = particles.y[i];
      world[2] = particles.z[i];
      sprite(cam, particles.tint[i] === 0 ? "glow" : "cool", world, particles.size[i], 0.8 * clamp(life / particles.span[i], 0, 1));
    }
  }

  let trailDebt = 0;

  return {
    resize(w, h, nextDpr, cam) {
      dpr = nextDpr;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      sky = createSky(ctx, cam, route.def.look.moon, route.items.length + 7);
      blend = "source-over";
    },

    render(view) {
      const { cam, pose, tier } = view;
      if (!sky) return;
      if (particles.cap !== tier.particles) setCap(particles, tier.particles);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = blend = "source-over";
      ctx.globalAlpha = 1;
      drawSky(ctx, sky, cam, atlas, view.t, tier.twinkle && !view.reduced);

      count = 0;
      // Ribbon cross-sections, on a fixed grid so the stripes don't swim.
      const s0 = Math.max(0, pose.s - BEHIND);
      const s1 = Math.min(track.length, pose.s + tier.far);
      let n = 0;
      for (let s = Math.ceil(s0 / tier.step) * tier.step; n < MAX_SECTIONS; s += tier.step) {
        const at = Math.min(s, s1);
        const half = halfAt(track, at);
        const a = n * 12;
        const xs = [-half, -half + BAND, half - BAND, half];
        for (let k = 0; k < 4; k++) {
          poseAt(track, at, xs[k], 0, world);
          toCamera(cam, world, tmp);
          sect[a + k * 3] = tmp[0];
          sect[a + k * 3 + 1] = tmp[1];
          sect[a + k * 3 + 2] = tmp[2];
        }
        sectS[n] = at;
        // The moon lights the top of the ribbon; seen from below (a higher loop), it is in shadow.
        const i = Math.min(Math.floor(at / track.step), track.n - 1) * 3;
        const up = track.u;
        const lit = Math.max(0, up[i] * LIGHT[0] + up[i + 1] * LIGHT[1] + up[i + 2] * LIGHT[2]);
        poseAt(track, at, 0, 0, world);
        const facing = (cam.eye[0] - world[0]) * up[i] + (cam.eye[1] - world[1]) * up[i + 1] + (cam.eye[2] - world[2]) * up[i + 2];
        sectShade[n] = (0.62 + 0.38 * lit) * (facing < 0 ? 0.45 : 1);
        n++;
        if (at >= s1) break;
      }
      for (let k = 0; k + 1 < n; k++) {
        const mid = (sectS[k] + sectS[k + 1]) / 2;
        const solidIdx = Math.min(Math.round(mid / track.step), track.n - 1);
        if (!track.solid[solidIdx]) continue;
        const a = k * 12;
        const b = a + 12;
        const z = (sect[a + 2] + sect[a + 11] + sect[b + 2] + sect[b + 11]) / 4;
        if (Math.max(sect[a + 2], sect[a + 11], sect[b + 2], sect[b + 11]) <= 0.3) continue;
        push(z, Kind.Quad, k);
      }

      // Items in view.
      const items = route.items;
      let lo = 0;
      let hi = items.length;
      while (lo < hi) {
        const m = (lo + hi) >> 1;
        if (items[m].s < s0) lo = m + 1;
        else hi = m;
      }
      for (let j = lo; j < items.length && items[j].s <= s1; j++) {
        const it = items[j];
        if ((it.kind === "spark" || it.kind === "big" || it.kind === "blossom" || it.kind === "dew") && view.sim.taken[j]) continue;
        poseAt(track, it.s, it.x, HOVER, world);
        const z = depth(cam, world);
        if (z > 0.3) push(z - 0.05, Kind.Item, j);
      }
      for (let k = 0; k < route.lamps.length; k++) {
        const s = route.lamps[k];
        if (s < s0 || s > s1) continue;
        poseAt(track, s, halfAt(track, s) + 0.9, 1.3, world);
        const z = depth(cam, world);
        if (z > 0.3) push(z, Kind.Lamp, k);
      }
      poseAt(track, track.length - 3, 0, 3.4, world);
      const lz = depth(cam, world);
      if (lz > 0.3) push(lz, Kind.Lantern, 0);
      const props = route.def.look.props;
      for (let k = 0; k < props.length; k++) {
        const prop = props[k];
        if (prop.s < s0 - 20 || prop.s > s1 + 30) continue;
        poseAt(track, prop.s, prop.x, 0, world);
        world[1] = groundY;
        const z = depth(cam, world);
        if (z > 0.3) push(z, Kind.Prop, k);
      }
      poseAt(track, pose.s, pose.x, pose.h + HOVER, world);
      push(depth(cam, world) - 0.1, Kind.Wick, 0);

      order.subarray(0, count).sort(farFirst);
      for (let o = 0; o < count; o++) {
        const e = order[o];
        switch (dk[e]) {
          case Kind.Quad:
            mode("source-over");
            ctx.globalAlpha = 1;
            drawQuad(cam, di[e], view);
            break;
          case Kind.Item:
            drawItem(cam, di[e], view);
            break;
          case Kind.Wick:
            drawWick(cam, view);
            break;
          case Kind.Lamp:
            drawLamp(cam, di[e], view);
            break;
          case Kind.Lantern:
            drawLantern(cam, view);
            break;
          case Kind.Prop:
            drawProp(cam, di[e], view);
            break;
        }
      }

      // Wick's trail: a few motes a second, more with more glow.
      if (view.sim.phase === "running" && view.dt > 0) {
        trailDebt += view.dt * (view.reduced ? 4 : 10 + 20 * clamp(view.sim.glow / 150, 0, 1));
        while (trailDebt >= 1) {
          trailDebt -= 1;
          poseAt(track, pose.s - 0.2, pose.x, pose.h + HOVER - 0.1, world);
          emit(particles, world, 1, 0.35, 0.7, 0.22, 0, 0.2);
        }
      }
      update(particles, view.dt);
      drawParticles(cam);
      ctx.globalAlpha = 1;
      mode("source-over");
    },

    burst(kind, item, sim) {
      const at = (s: number, x: number, h: number) => poseAt(track, s, x, h, v3());
      switch (kind) {
        case "spark": {
          const it = route.items[item];
          emit(particles, at(it.s, it.x, it.h + HOVER), it.kind === "big" ? 14 : 5, 1.6, 0.5, 0.3, 0);
          break;
        }
        case "blossom":
        case "dew": {
          const it = route.items[item];
          emit(particles, at(it.s, it.x, HOVER), 10, 1.8, 0.6, 0.35, kind === "dew" ? 1 : 0);
          break;
        }
        case "hit":
        case "shielded":
        case "dip":
          emit(particles, at(sim.s, sim.x, sim.h + HOVER), kind === "shielded" ? 16 : 10, 2.2, 0.6, 0.4, 1);
          break;
        case "lamp": {
          const s = route.lamps[item];
          emit(particles, at(s, (item % 2 === 0 ? 1 : -1) * (halfAt(track, s) + 0.9), 1.3), 18, 1.6, 0.9, 0.4, 0, 0.6);
          break;
        }
        case "finish":
          emit(particles, at(track.length - 3, 0, 3.4), 40, 3, 1.4, 0.6, 0, 0.5);
          break;
      }
    },

    destroy() {
      // WebKit frees canvas memory only when a canvas shrinks.
      canvas.width = canvas.height = 0;
      atlas.canvas.width = atlas.canvas.height = 0;
      colors.clear();
    },
  };
}
