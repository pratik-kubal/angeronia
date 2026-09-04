"use client";

import { useEffect, type RefObject } from "react";
import { clamp, bindScroll, prefersReducedMotion } from "./scroll";

// Scroll-drawn continuity line. As the (tall) philosophy section scrolls past, a
// single continuous SVG stroke draws itself (stroke-dashoffset), a pen dot rides
// the tip, node dots light as the pen reaches them, and the three beats light in
// turn — all keyed off one scroll progress. Replaces the earlier scroll-scrubbed
// Möbius so the band appears only once (in the hero).
const NODE_FRACS = [0.2, 0.54, 0.88];

export function useContinuityScrub(sectionRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const path = section.querySelector<SVGPathElement>("[data-line-path]");
    const pen = section.querySelector<SVGCircleElement>("[data-line-pen]");
    const nodes = [...section.querySelectorAll<SVGCircleElement>("[data-line-node]")];
    const beats = [...section.querySelectorAll<HTMLElement>("[data-beat]")];
    const label = section.querySelector<HTMLElement>("[data-line-progress]");
    if (!path) return;

    const len = path.getTotalLength();
    path.style.strokeDasharray = `${len}`;

    // Seat the node dots onto the path at fixed fractions (once).
    nodes.forEach((node, i) => {
      const frac = NODE_FRACS[i] ?? (i + 1) / (nodes.length + 1);
      const pt = path.getPointAtLength(len * frac);
      node.setAttribute("cx", `${pt.x}`);
      node.setAttribute("cy", `${pt.y}`);
    });

    const lightBeats = (idx: number) => {
      beats.forEach((b, i) => {
        const on = i === idx;
        b.dataset.active = on ? "true" : "false";
        const p = b.querySelector<HTMLElement>("p");
        if (p) p.style.opacity = on ? "1" : "0.26";
      });
    };

    if (prefersReducedMotion()) {
      path.style.strokeDashoffset = "0";
      if (pen) pen.style.opacity = "0";
      nodes.forEach((n) => (n.dataset.lit = "true"));
      beats.forEach((b) => {
        b.dataset.active = "true";
        const p = b.querySelector<HTMLElement>("p");
        if (p) p.style.opacity = "1";
      });
      if (label) label.textContent = "One unbroken stroke";
      return;
    }

    path.style.strokeDashoffset = `${len}`;
    const n = Math.max(1, beats.length);
    const update = () => {
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight;
      const total = rect.height - vh;
      const p =
        total > 0
          ? clamp(-rect.top / total, 0, 1)
          : clamp((vh * 0.5 - rect.top) / (vh * 0.5), 0, 1);

      path.style.strokeDashoffset = `${len * (1 - p)}`;

      if (pen) {
        const pt = path.getPointAtLength(len * p);
        pen.setAttribute("cx", `${pt.x}`);
        pen.setAttribute("cy", `${pt.y}`);
        pen.style.opacity = p > 0.01 && p < 0.995 ? "1" : "0";
      }
      nodes.forEach((node, i) => {
        const frac = NODE_FRACS[i] ?? (i + 1) / (nodes.length + 1);
        node.dataset.lit = p >= frac - 0.01 ? "true" : "false";
      });

      const activeIdx = clamp(Math.floor(p * n + 0.15), 0, n - 1);
      lightBeats(activeIdx);

      if (label) label.textContent = `Drawing · ${Math.round(p * 100)}%`;
    };
    return bindScroll(update);
  }, [sectionRef]);
}
