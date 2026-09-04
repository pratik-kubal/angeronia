// Small shared helpers for the scroll-scrubbed effects.

export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

export const prefersReducedMotion = () =>
  typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

// requestAnimationFrame-throttled scroll+resize binding. Returns a disposer.
export function bindScroll(update: () => void): () => void {
  let ticking = false;
  const onScroll = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        update();
      });
    }
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", update);
  update();
  return () => {
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", update);
  };
}
