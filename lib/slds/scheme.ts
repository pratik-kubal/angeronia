/**
 * Colour-scheme plumbing for SLDS 2.
 *
 * SLDS 2 has no dark palette: every colour token is a `light-dark()` pair, so
 * the whole system switches on the CSS `color-scheme` property. The
 * `slds-color-scheme_*` classes (from the design system's `darkMode` utility)
 * are the only thing that needs to change, and they live on `<html>`.
 */

export const COLOR_SCHEMES = ["light", "dark", "system"] as const;

export type ColorScheme = (typeof COLOR_SCHEMES)[number];

/** The class `next-themes` writes on `<html>` for each scheme. */
export const COLOR_SCHEME_CLASS: Record<ColorScheme, string> = {
  light: "slds-color-scheme_light",
  dark: "slds-color-scheme_dark",
  system: "slds-color-scheme_system",
};

export const DEFAULT_COLOR_SCHEME: ColorScheme = "system";

export function isColorScheme(value: string | undefined): value is ColorScheme {
  return value !== undefined && (COLOR_SCHEMES as readonly string[]).includes(value);
}
