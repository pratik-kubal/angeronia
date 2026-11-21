"use client";

import * as React from "react";

/** How much of the parent's width the text may take: never quite all of it.
 *  0.998, not design.md's 0.99, which left the name 14px short of the right
 *  margin at 1440 (ADR-030); the loop below still never lets it overrun. */
const FILL = 0.998;
/** Imbue's optical size changes its widths with the type size, so one pass is not always enough. */
const PASSES = 6;

/**
 * Fits its text to the full width of its parent (design.md §4.2). The size is
 * found by measuring the rendered text, never by a guessed ratio: on mount,
 * when the parent changes width, when the window resizes, and whenever the web
 * fonts arrive. It never leaves the text wider than the parent.
 *
 * The parent must be a block box. Its stylesheet gives this span
 * `display: inline-block` and the fallback size it holds before the first
 * measurement (hero.module.css for the name, close.module.css for the
 * wordmark).
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

    // Refitting changes the parent's height, so doing it inside the observer's
    // callback would raise "ResizeObserver loop completed with undelivered
    // notifications". Fit on the next frame instead.
    let lastWidth = parent.clientWidth;
    let frame = 0;
    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(() => {
            if (parent.clientWidth === lastWidth) return;
            lastWidth = parent.clientWidth;
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(fit);
          });
    observer?.observe(parent);

    window.addEventListener("resize", fit);
    const fonts = document.fonts;
    fonts?.ready.then(fit);
    fonts?.addEventListener("loadingdone", fit);

    return () => {
      cancelAnimationFrame(frame);
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
