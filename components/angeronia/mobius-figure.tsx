"use client";

import { useEffect, useRef, type MutableRefObject } from "react";
import { useTheme } from "next-themes";
import { hero } from "@/data/angeronia";

// Hand-drawn (rough.js) 3D Möbius band rendered to <canvas> — the Angeronia Labs
// signature device. Two modes share one renderer:
//   • "auto"   — auto-rotates, with pointer drag/scrub + fling (hero).
//   • "scroll" — rotation is driven entirely by `phiRef` (scroll-scrubbed), which
//                a parent hook updates from the section's scroll progress.
// Ported from the pratik-kubal.com v2 Möbius (design-reference Rough figure).
export function MobiusFigure({
  mode,
  phiRef,
  ariaLabel,
}: {
  mode: "auto" | "scroll";
  phiRef?: MutableRefObject<number>;
  ariaLabel: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  // Live color/shade read each frame from this ref, so a theme switch re-colors
  // the figure with no rebuild. Light/Dark = citron; Noir = paper fill + ink shade.
  const colorRef = useRef<{ color: string; shade: string | null }>({
    color: "#C7DD3A",
    shade: null,
  });

  useEffect(() => {
    colorRef.current =
      theme === "bw"
        ? { color: "#FBFAF6", shade: "#14130F" }
        : { color: "#C7DD3A", shade: null };
  }, [theme]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

    const { R, w: W, t: T, speed, tilt } = hero.mobius;
    const N = 32; // segments around the loop (4 surface quads each)
    const DEG_PER_PX = 0.6;
    const MAX_SPIN = 320;

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

    const cv = document.createElement("canvas");
    cv.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;";
    cv.setAttribute("aria-hidden", "true");
    el.appendChild(cv);
    const ctx = cv.getContext("2d")!;

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
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    // fixed camera basis (a pleasing 3/4 angle), origin centered
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

    const rgb = (h: string) => {
      h = (h || "#C7DD3A").replace("#", "");
      if (h.length === 3) h = h.split("").map((c) => c + c).join("");
      const n = parseInt(h, 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    };

    type RoughCanvas = { polygon: (pts: number[][], opts: object) => void };
    let rc: RoughCanvas | null = null;

    const draw = () => {
      if (!rc) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cssW, cssH);

      const base = rgb(colorRef.current.color);
      const shade = colorRef.current.shade ? rgb(colorRef.current.shade) : null;
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
          const sh = 0.58 + 0.5 * L;
          const A = proj(Aw);
          const B = proj(Bw);
          const C = proj(Cw);
          const D = proj(Dw);
          const cz = (A[2] + B[2] + C[2] + D[2]) / 4;
          let r: number;
          let g: number;
          let b: number;
          if (shade) {
            const k = 0.08 + 0.92 * L;
            r = (shade[0] + (base[0] - shade[0]) * k) | 0;
            g = (shade[1] + (base[1] - shade[1]) * k) | 0;
            b = (shade[2] + (base[2] - shade[2]) * k) | 0;
          } else {
            r = Math.min(255, base[0] * sh) | 0;
            g = Math.min(255, base[1] * sh) | 0;
            b = Math.min(255, base[2] * sh) | 0;
          }
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
      if (mode === "scroll") {
        // Rotation is authored by scroll: read the parent-driven angle. Drag can
        // still nudge it, but scroll is the source of truth each frame.
        if (phiRef && !dragging) phi = phiRef.current;
      } else {
        if (!userControl) spin = speed;
        if (!held && !dragging) {
          phi = (phi + spin * dt) % 360;
          if (phi < 0) phi += 360;
        }
      }
      draw();
      raf = requestAnimationFrame(loop);
    };
    const startLoop = () => {
      if (!alive || !visible || reduce || !rc || raf) return;
      last = performance.now();
      raf = requestAnimationFrame(loop);
    };
    let roughReq = false;
    const ensureRough = () => {
      if (roughReq || !alive || !visible) return;
      roughReq = true;
      import("roughjs")
        .then((m) => {
          const rough = (m as { default?: unknown }).default || m;
          rc = (rough as { canvas: (c: HTMLCanvasElement) => RoughCanvas }).canvas(cv);
          if (reduce) {
            if (mode === "scroll" && phiRef) phi = phiRef.current;
            draw();
          } else {
            startLoop();
          }
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

    // ── pointer drag / flick (both modes; a gentle scrub) ──
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
      el.style.cursor = "grab";
      if (mode === "scroll") return; // scroll reclaims the angle on the next frame
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
      el.style.cursor = "grabbing";
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
      e.preventDefault();
    };
    // Drag is a bonus in auto mode; in scroll mode the wheel/scroll drives it, so
    // leave the surface non-grabbable to keep vertical scroll natural on the figure.
    if (!reduce && mode === "auto") el.addEventListener("pointerdown", onDown);

    return () => {
      alive = false;
      if (raf) cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      cv.remove();
    };
  }, [mode, phiRef]);

  return (
    <div
      ref={wrapRef}
      className="ang-figure"
      role="img"
      aria-label={ariaLabel}
      style={{
        position: "relative",
        cursor: mode === "auto" ? "grab" : "default",
        touchAction: mode === "auto" ? "none" : "pan-y",
        userSelect: "none",
      }}
    />
  );
}
