"use client";

import { useEffect } from "react";
import { prefersReducedMotion } from "./scroll";

// Gentle enter-only reveal: every [data-reveal] element rises + fades in the
// first time it scrolls into view, then is left alone (never fades back out, so
// nothing can vanish under the reader). No-JS / reduced-motion shows everything.
export function useSectionReveals() {
  useEffect(() => {
    const els = [...document.querySelectorAll<HTMLElement>("[data-reveal]")];
    if (!els.length) return;
    if (prefersReducedMotion() || typeof IntersectionObserver === "undefined") {
      els.forEach((el) => {
        el.style.opacity = "1";
        el.style.transform = "none";
      });
      return;
    }
    els.forEach((el) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(16px)";
      el.style.transition = "opacity 0.6s ease, transform 0.6s cubic-bezier(0.2,0.8,0.2,1)";
      el.style.willChange = "opacity, transform";
    });
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const el = e.target as HTMLElement;
            const delay = Number(el.dataset.revealDelay || 0);
            el.style.transitionDelay = `${delay}ms`;
            el.style.opacity = "1";
            el.style.transform = "none";
            io.unobserve(el);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}
