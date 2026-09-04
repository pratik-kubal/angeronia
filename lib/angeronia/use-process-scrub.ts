"use client";

import { useEffect, type RefObject } from "react";
import { clamp, bindScroll, prefersReducedMotion } from "./scroll";

// Scroll-scrubbed process timeline: a rail fills downward as you scroll, and each
// step's dot fills + label activates the moment the fill line passes it. The fill
// height and the per-step "reached" state both key off one viewport line (50vh)
// so they stay in perfect lockstep.
export function useProcessScrub(sectionRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const rail = section.querySelector<HTMLElement>("[data-process-rail]");
    const fill = section.querySelector<HTMLElement>("[data-process-fill]");
    const steps = [...section.querySelectorAll<HTMLElement>("[data-process-step]")];
    if (!rail || !fill) return;

    if (prefersReducedMotion()) {
      fill.style.height = "100%";
      steps.forEach((s) => (s.dataset.reached = "true"));
      return;
    }

    const update = () => {
      const railRect = rail.getBoundingClientRect();
      const line = window.innerHeight * 0.5;
      const filled = clamp((line - railRect.top) / Math.max(1, railRect.height), 0, 1);
      fill.style.height = `${filled * 100}%`;
      steps.forEach((step) => {
        const dot = step.querySelector<HTMLElement>("[data-process-dot]");
        const anchor = dot ? dot.getBoundingClientRect().top : step.getBoundingClientRect().top;
        step.dataset.reached = anchor <= line + 4 ? "true" : "false";
      });
    };
    return bindScroll(update);
  }, [sectionRef]);
}
