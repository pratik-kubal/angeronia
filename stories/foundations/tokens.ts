/**
 * Helpers for the Foundations boards.
 *
 * Everything here reads the *live* computed value of a token rather than a copy
 * of the theme JSON, so a board can never show a colour the page is not
 * actually using — including after a `@carbon/react` bump.
 */

/** Resolved value of a custom property on `<html>`. */
export function token(name: string): string {
  if (typeof document === "undefined") return "";
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/** Resolve any colour value to `rgb(...)` by letting the browser do it. */
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

/** Carbon's teal ramp, lightest first — the brand family. */
export const TEAL_STEPS = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100] as const;

/**
 * The two ramps side by side on the Brand board.
 *
 * Carbon's own interactive family is Blue; Angeronia's is Teal. Teal 60/40 are
 * luminance twins of Blue 60/40, which is what lets the swap keep every
 * contrast pairing Carbon designed around blue.
 */
export const CARBON_TEAL: Record<number, string> = {
  10: "#d9fbfb",
  20: "#9ef0f0",
  30: "#3ddbd9",
  40: "#08bdba",
  50: "#009d9a",
  60: "#007d79",
  70: "#005d5d",
  80: "#004144",
  90: "#022b30",
  100: "#081a1c",
};

export const CARBON_BLUE: Record<number, string> = {
  10: "#edf5ff",
  20: "#d0e2ff",
  30: "#a6c8ff",
  40: "#78a9ff",
  50: "#4589ff",
  60: "#0f62fe",
  70: "#0043ce",
  80: "#002d9c",
  90: "#001d6c",
  100: "#001141",
};
