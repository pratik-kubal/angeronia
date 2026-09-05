/**
 * Helpers for the Foundations boards.
 *
 * Everything here reads the *live* computed value of a styling hook rather
 * than a copy of the token JSON, so a board can never show a colour the page
 * is not actually using — including after a `@salesforce-ux/design-system-2`
 * bump.
 */

/** Resolved value of a styling hook on `<html>`. */
export function hook(name: string): string {
  if (typeof document === "undefined") return "";
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/** Resolve a colour hook to `rgb(...)` by letting the browser do it. */
export function resolveColor(value: string): string {
  const probe = document.createElement("span");
  probe.style.color = value;
  probe.style.display = "none";
  document.body.appendChild(probe);
  const resolved = getComputedStyle(probe).color;
  probe.remove();
  return resolved;
}

function channels(color: string): [number, number, number] {
  const m = resolveColor(color).match(/-?[\d.]+/g);
  if (!m) return [0, 0, 0];
  return [Number(m[0]), Number(m[1]), Number(m[2])];
}

function relativeLuminance(color: string): number {
  const [r, g, b] = channels(color).map((c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2.x contrast ratio between two colour values. */
export function contrast(fg: string, bg: string): number {
  const a = relativeLuminance(fg);
  const b = relativeLuminance(bg);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/** The seventeen brand reference steps, darkest first. */
export const BRAND_STEPS = [
  5, 10, 15, 20, 30, 35, 40, 45, 50, 55, 60, 65, 70, 80, 85, 90, 95,
] as const;

/** Cosmos's own electric-blue ramp, for the side-by-side on the Brand board. */
export const COSMOS_BRAND: Record<number, string> = {
  5: "#000314",
  10: "#001642",
  15: "#001e5b",
  20: "#002775",
  30: "#022ac0",
  35: "#003ecd",
  40: "#0250d9",
  45: "#045dec",
  50: "#066afe",
  55: "#287efe",
  60: "#4992fe",
  65: "#5f9ffe",
  70: "#7cb1fe",
  80: "#a8cbff",
  85: "#c2daff",
  90: "#d6e6ff",
  95: "#edf4ff",
};
