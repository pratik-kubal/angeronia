"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { hero } from "@/data/angeronia";

/**
 * The hero Möbius: a hand-drawn (rough.js) 3D band on a `<canvas>`, turning on
 * its own, draggable to scrub and flick.
 *
 * Ported from `../portfolio`'s `mobius-figure.tsx`. Three things change to keep
 * it inside this site's contract (ADR-012): the colours are read back from the
 * theme's hooks instead of being hard-coded citron, every rule lives in
 * `app/site.css` rather than a `style` attribute, and the figure is storied.
 * The rotation itself is the deviation, waived for this one figure by ADR-013.
 *
 * Exposed as a labelled image — `role="img"` on the wrapper, `aria-hidden` on
 * the canvas — so it reads as one decorative figure rather than a bare canvas.
 */

/** The band itself: ring radius, half-width, half-thickness, °/s, and roll. */
const GEOMETRY = { R: 2.6, w: 0.8, t: 0.48, speed: 30, tilt: 0 } as const;
/** Segments around the loop; each contributes four surface quads. */
const N = 32;
const DEG_PER_PX = 0.6;
const MAX_SPIN = 320;

/**
 * Pull `r,g,b` out of a computed colour.
 *
 * The theme's hooks are `light-dark()` pairs, and a custom property's computed
 * value is its token stream — `light-dark(#005d5d, #9ef0f0)` — not the branch
 * that applies. Resolving it means reading a real property instead, which is
 * why the fill and the shade are carried as `color` on two elements. Those
 * resolve to `rgb()` because every hook in the ramp is a hex.
 */
function readRgb(el: Element): [number, number, number] {
  const parts = getComputedStyle(el).color.match(/[\d.]+/g);
  if (!parts || parts.length < 3) return [0, 0, 0];
  return [Number(parts[0]), Number(parts[1]), Number(parts[2])];
}

export function MobiusFigure() {
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const { resolvedTheme } = useTheme();

  // Bumped on every scheme change. The draw loop re-reads the two probe
  // elements on the next frame rather than calling getComputedStyle 60×/s.
  const dirtyRef = React.useRef(0);
  // Set once rough.js has landed. Under `prefers-reduced-motion` nothing else
  // will ever repaint, so a scheme change has to ask for it by hand or the band
  // keeps the previous scheme's teal.
  const redrawRef = React.useRef<(() => void) | null>(null);
  React.useEffect(() => {
    dirtyRef.current += 1;
    redrawRef.current?.();
  }, [resolvedTheme]);

  React.useEffect(() => {
    const el = wrapRef.current;
    const cv = canvasRef.current;
    if (!el || !cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const { R, w: W, t: T, speed, tilt } = GEOMETRY;

    let alive = true;
    let visible = true;
    let raf = 0;
    let phi = 0;
    let last = performance.now();
    let spin: number = speed;
    let userControl = false;
    let dragging = false;
    let held = false;
    let moved = 0;
    let lastX = 0;
    let samples: { t: number; x: number }[] = [];

    let fill: [number, number, number] = [0, 0, 0];
    let shade: [number, number, number] = [0, 0, 0];
    let seenDirty = -1;
    const syncColors = () => {
      fill = readRgb(el);
      shade = readRgb(cv);
      seenDirty = dirtyRef.current;
    };
    syncColors();

    let cssW = 460;
    let cssH = 460;
    let dpr = 1;
    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      cssW = el.clientWidth || 460;
      cssH = el.clientHeight || 460;
      cv.width = Math.round(cssW * dpr);
      cv.height = Math.round(cssH * dpr);
    };
    resize();
    // Assigning width/height clears the canvas. The rAF loop repaints on the
    // next frame — but under `prefers-reduced-motion` there is no next frame,
    // so a resize would leave the hero figure blank. The observer paints for
    // it. (The synchronous `resize()` above cannot: `draw` and `rc` are both
    // still in their temporal dead zone here. The observer callback runs after
    // this effect body, so by then they exist.)
    const ro = new ResizeObserver(() => {
      resize();
      if (reduce) draw();
    });
    ro.observe(el);

    // Fixed camera basis (a pleasing 3/4 angle), origin centred.
    const eye = [4.6, -8.8, 7.4];
    const sub = (a: number[], b: number[]) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
    const cross = (a: number[], b: number[]) => [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0],
    ];
    const norm = (v: number[]) => {
      const l = Math.hypot(v[0], v[1], v[2]) || 1;
      return [v[0] / l, v[1] / l, v[2] / l];
    };
    const camZ = norm(sub(eye, [0, 0, 0]));
    const camX = norm(cross([0, 0, 1], camZ));
    const camY = cross(camZ, camX);
    const f = 1 / Math.tan((23 * Math.PI) / 180 / 2);
    const light = norm([4, -5, 8]);

    type RoughCanvas = { polygon: (pts: number[][], opts: object) => void };
    let rc: RoughCanvas | null = null;

    const draw = () => {
      if (!rc) return;
      if (seenDirty !== dirtyRef.current) syncColors();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cssW, cssH);

      const ph = (phi * Math.PI) / 180;
      const cph = Math.cos(ph);
      const sph = Math.sin(ph);
      const tl = (tilt * Math.PI) / 180;
      const ct = Math.cos(tl);
      const stt = Math.sin(tl);
      const signs = [
        [W, T],
        [W, -T],
        [-W, -T],
        [-W, T],
      ];

      const corner = (cphi: number, sphi: number, u: number, vv: number, ss: number) => {
        const a = u / 2;
        const cu = Math.cos(u);
        const su = Math.sin(u);
        const dvx = Math.cos(a) * cu;
        const dvy = Math.cos(a) * su;
        const dvz = Math.sin(a);
        const dsx = -Math.sin(a) * cu;
        const dsy = -Math.sin(a) * su;
        const dsz = Math.cos(a);
        const X = R * cu + vv * dvx + ss * dsx;
        const Y = R * su + vv * dvy + ss * dsy;
        const Z = vv * dvz + ss * dsz;
        return [X * cphi - Y * sphi, X * sphi + Y * cphi, Z];
      };
      const proj600 = (p: number[]) => {
        const rx = p[0] - eye[0];
        const ry = p[1] - eye[1];
        const rz = p[2] - eye[2];
        const cx = camX[0] * rx + camX[1] * ry + camX[2] * rz;
        const cy = camY[0] * rx + camY[1] * ry + camY[2] * rz;
        const cz = camZ[0] * rx + camZ[1] * ry + camZ[2] * rz;
        const ndx = (f * cx) / -cz;
        const ndy = (f * cy) / -cz;
        let sx = (ndx * 0.5 + 0.5) * 600;
        let sy = (-ndy * 0.5 + 0.5) * 600;
        if (tilt) {
          const dx = sx - 300;
          const dy = sy - 300;
          sx = 300 + dx * ct - dy * stt;
          sy = 300 + dx * stt + dy * ct;
        }
        return [sx, sy, cz];
      };

      // Fit the projected band to the box every frame, so the figure neither
      // clips nor swims as it turns.
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      for (let i = 0; i <= N; i++) {
        const u = (i / N) * 2 * Math.PI;
        for (let fI = 0; fI < 4; fI++) {
          const pr = proj600(corner(cph, sph, u, signs[fI][0], signs[fI][1]));
          if (pr[0] < minX) minX = pr[0];
          if (pr[0] > maxX) maxX = pr[0];
          if (pr[1] < minY) minY = pr[1];
          if (pr[1] > maxY) maxY = pr[1];
        }
      }
      const fcx = (minX + maxX) / 2;
      const fcy = (minY + maxY) / 2;
      const fw = Math.max(1, maxX - minX);
      const fh = Math.max(1, maxY - minY);
      const scale = Math.min(cssW / fw, cssH / fh) * 0.985;
      const proj = (p: number[]) => {
        const s6 = proj600(p);
        return [cssW / 2 + (s6[0] - fcx) * scale, cssH / 2 + (s6[1] - fcy) * scale, s6[2]];
      };

      const quads: {
        cz: number;
        pts: number[][];
        fill: string;
        stroke: string;
        seed: number;
      }[] = [];
      for (let i = 0; i < N; i++) {
        const u1 = (i / N) * 2 * Math.PI;
        const u2 = ((i + 1) / N) * 2 * Math.PI;
        for (let fI = 0; fI < 4; fI++) {
          const gI = (fI + 1) % 4;
          const Aw = corner(cph, sph, u1, signs[fI][0], signs[fI][1]);
          const Bw = corner(cph, sph, u1, signs[gI][0], signs[gI][1]);
          const Cw = corner(cph, sph, u2, signs[gI][0], signs[gI][1]);
          const Dw = corner(cph, sph, u2, signs[fI][0], signs[fI][1]);
          const e1x = Bw[0] - Aw[0];
          const e1y = Bw[1] - Aw[1];
          const e1z = Bw[2] - Aw[2];
          const e2x = Dw[0] - Aw[0];
          const e2y = Dw[1] - Aw[1];
          const e2z = Dw[2] - Aw[2];
          let nx = e1y * e2z - e1z * e2y;
          let ny = e1z * e2x - e1x * e2z;
          let nz = e1x * e2y - e1y * e2x;
          const nl = Math.hypot(nx, ny, nz) || 1;
          nx /= nl;
          ny /= nl;
          nz /= nl;
          const L = Math.abs(nx * light[0] + ny * light[1] + nz * light[2]);
          const A = proj(Aw);
          const B = proj(Bw);
          const C = proj(Cw);
          const D = proj(Dw);
          const cz = (A[2] + B[2] + C[2] + D[2]) / 4;
          // Lambert term picks a point between the shaded end of the accent and
          // the lit one, so both schemes shade with their own two hooks rather
          // than by multiplying a literal toward black.
          const k = 0.08 + 0.92 * L;
          const r = (shade[0] + (fill[0] - shade[0]) * k) | 0;
          const g = (shade[1] + (fill[1] - shade[1]) * k) | 0;
          const b = (shade[2] + (fill[2] - shade[2]) * k) | 0;
          quads.push({
            cz,
            pts: [
              [A[0], A[1]],
              [B[0], B[1]],
              [C[0], C[1]],
              [D[0], D[1]],
            ],
            fill: `rgb(${r},${g},${b})`,
            stroke: `rgb(${(r * 0.55) | 0},${(g * 0.55) | 0},${(b * 0.55) | 0})`,
            seed: i * 4 + fI + 1,
          });
        }
      }
      // Painter's algorithm: far quads first. A fixed per-quad seed keeps the
      // sketch strokes stable frame to frame instead of boiling.
      quads.sort((a, b) => a.cz - b.cz);
      for (const q of quads) {
        rc.polygon(q.pts, {
          fill: q.fill,
          fillStyle: "solid",
          stroke: q.stroke,
          strokeWidth: 1,
          roughness: 1.15,
          bowing: 1.4,
          seed: q.seed,
        });
      }
    };

    const loop = () => {
      if (!alive || !visible) {
        raf = 0;
        return;
      }
      const now = performance.now();
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!userControl) spin = speed;
      if (!held && !dragging) {
        phi = (phi + spin * dt) % 360;
        if (phi < 0) phi += 360;
      }
      draw();
      raf = requestAnimationFrame(loop);
    };
    // Only turn while the hero is on screen; once scrolled past, stop the loop
    // instead of redrawing 128 rough.js quads forever (ADR-013).
    const startLoop = () => {
      if (!alive || !visible || reduce || !rc || raf) return;
      last = performance.now();
      raf = requestAnimationFrame(loop);
    };
    // rough.js is a lazy chunk, fetched the first time the figure is actually
    // visible. The figure is display:none on phones, so the observer never
    // fires there and a phone downloads neither the chunk nor a frame of work.
    let roughReq = false;
    const ensureRough = () => {
      if (roughReq || !alive || !visible) return;
      roughReq = true;
      import("roughjs")
        .then((m) => {
          const rough = (m as { default?: unknown }).default ?? m;
          rc = (rough as { canvas: (c: HTMLCanvasElement) => RoughCanvas }).canvas(cv);
          redrawRef.current = draw;
          if (reduce) draw();
          else startLoop();
        })
        .catch(() => {
          roughReq = false;
        });
    };
    const io = new IntersectionObserver(
      (entries) => {
        visible = entries[0].isIntersecting;
        if (visible) {
          ensureRough();
          startLoop();
        } else if (raf) {
          cancelAnimationFrame(raf);
          raf = 0;
        }
      },
      { threshold: 0 },
    );
    io.observe(el);

    // ── pointer drag / flick ──
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      moved += Math.abs(dx);
      phi = (phi + dx * DEG_PER_PX) % 360;
      if (phi < 0) phi += 360;
      const now = performance.now();
      samples.push({ t: now, x: e.clientX });
      while (samples.length > 2 && now - samples[0].t > 120) samples.shift();
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      dragging = false;
      held = false;
      el.classList.remove("site-hero__figure_grabbing");
      if (moved < 3) return;
      const s = samples;
      if (s && s.length >= 2) {
        const a = s[0];
        const b = s[s.length - 1];
        const dtm = (b.t - a.t) / 1000;
        const v = dtm > 0 ? ((b.x - a.x) / dtm) * DEG_PER_PX : 0;
        spin = Math.max(-MAX_SPIN, Math.min(MAX_SPIN, v));
      }
    };
    const onDown = (e: PointerEvent) => {
      dragging = true;
      held = true;
      userControl = true;
      moved = 0;
      lastX = e.clientX;
      samples = [{ t: performance.now(), x: e.clientX }];
      el.classList.add("site-hero__figure_grabbing");
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
      e.preventDefault();
    };
    if (!reduce) el.addEventListener("pointerdown", onDown);

    return () => {
      alive = false;
      redrawRef.current = null;
      if (raf) cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, []);

  return (
    <div ref={wrapRef} className="site-hero__figure" role="img" aria-label={hero.figureAlt}>
      <canvas ref={canvasRef} className="site-hero__canvas" aria-hidden="true" />
    </div>
  );
}
