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

/**
 * What the switcher offers, which is not the same list.
 *
 * `system` stays a real scheme — it is the default, so a first visit follows
 * the reader's OS — but it is no longer a button. The toggle shows the scheme
 * in force rather than the setting that produced it, so on a system-dark
 * machine the Dark button is the one that reads pressed. The cost is that once
 * someone pins a scheme there is no control to hand it back to the OS; clearing
 * site data is the only way back, which is the trade the two-button toggle
 * makes.
 */
export const SELECTABLE_COLOR_SCHEMES = ["light", "dark"] as const;

export type SelectableColorScheme = (typeof SELECTABLE_COLOR_SCHEMES)[number];

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
