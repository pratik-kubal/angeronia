"use client";

import { useEffect, type RefObject } from "react";
import { clamp, bindScroll, prefersReducedMotion } from "./scroll";

// Scroll-scrubbed meter graph. As the Proof band crosses the viewport, each row's
// number counts up and its meter bar fills to that metric's fraction, in lockstep.
// Scrubbing back winds both down. No-JS / reduced-motion shows the final state.
export function useMetricsMeters(sectionRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const rows = [...section.querySelectorAll<HTMLElement>("[data-meter-row]")];
    if (!rows.length) return;

    const renderNum = (el: HTMLElement, value: number) => {
      const dec = Number(el.dataset.decimals || 0);
      const suffix = el.dataset.suffix || "";
      el.textContent = value.toFixed(dec) + suffix;
    };

    const apply = (p: number) => {
      rows.forEach((row) => {
        const num = row.querySelector<HTMLElement>("[data-count]");
        const fill = row.querySelector<HTMLElement>("[data-meter-fill]");
        if (num) {
          const from = Number(num.dataset.from || 0);
          const to = Number(num.dataset.to || 0);
          renderNum(num, from + (to - from) * p);
        }
        if (fill) {
          const frac = Number(fill.dataset.frac || 0);
          fill.style.width = `${frac * p * 100}%`;
        }
      });
    };

    // Static ghost baselines (e.g. "was 50%") are set once.
    rows.forEach((row) => {
      const ghost = row.querySelector<HTMLElement>("[data-meter-ghost]");
      if (ghost) ghost.style.width = `${Number(ghost.dataset.before || 0) * 100}%`;
    });

    if (prefersReducedMotion()) {
      apply(1);
      return;
    }

    const update = () => {
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = clamp((vh * 0.82 - rect.top) / (vh * 0.5), 0, 1);
      apply(p);
    };
    return bindScroll(update);
  }, [sectionRef]);
}
