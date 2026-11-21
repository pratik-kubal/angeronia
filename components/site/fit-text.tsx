"use client";

import * as React from "react";

/** How much of the parent's width the text may take: never quite all of it. */
const FILL = 0.99;
/** Imbue's optical size changes its widths with the type size, so one pass is not always enough. */
const PASSES = 6;

/**
 * Fits its text to the full width of its parent (design.md §4.2). The size is
 * found by measuring the rendered text, never by a guessed ratio: on mount,
 * when the parent changes width, when the window resizes, and whenever the web
 * fonts arrive. It never leaves the text wider than the parent.
 *
 * The parent must be a block box. Its stylesheet gives this span
 * `display: inline-block` (hero.module.css), and the fallback size it holds
 * before the first measurement.
 */
export function FitText({ children }: { children: string }) {
  const ref = React.useRef<HTMLSpanElement>(null);

  React.useLayoutEffect(() => {
    const el = ref.current;
    const parent = el?.parentElement;
    if (!el || !parent) return;

    const fit = () => {
      const available = parent.clientWidth;
      if (available <= 0) return;
      const measure = () => el.getBoundingClientRect().width;
      const apply = (px: number) => {
        el.style.fontSize = `${px}px`;
      };

      let size = parseFloat(getComputedStyle(el).fontSize);
      let width = measure();
      if (!size || !width) return;

      for (let pass = 0; pass < PASSES; pass += 1) {
        const next = Math.floor((available / width) * size * FILL);
        if (next < 1 || next === Math.floor(size)) break;
        size = next;
        apply(size);
        width = measure();
      }
      // Whatever the passes settled on, never wider than the parent.
      while (width > available && size > 1) {
        size -= 1;
        apply(size);
        width = measure();
      }
    };

    fit();

    let lastWidth = parent.clientWidth;
    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(() => {
            if (parent.clientWidth === lastWidth) return;
            lastWidth = parent.clientWidth;
            fit();
          });
    observer?.observe(parent);

    window.addEventListener("resize", fit);
    const fonts = document.fonts;
    fonts?.ready.then(fit);
    fonts?.addEventListener("loadingdone", fit);

    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", fit);
      fonts?.removeEventListener("loadingdone", fit);
    };
  }, [children]);

  return (
    <span ref={ref} data-fit="">
      {children}
    </span>
  );
}
