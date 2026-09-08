/**
 * Colour-scheme plumbing for Carbon.
 *
 * Carbon ships one token set per theme, and `styles/_themes.scss` emits two of
 * them — White under `:root`, Gray 100 under `:root[data-theme="dark"]`. So the
 * only thing that has to change to switch schemes is that one attribute, which
 * `next-themes` writes on `<html>`.
 *
 * Replaces `lib/slds/scheme.ts`, where the switch was a `slds-color-scheme_*`
 * class driving CSS `color-scheme` through `light-dark()` pairs (ADR-015).
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

/** The attribute `next-themes` writes on `<html>`, and that the theme reads. */
export const COLOR_SCHEME_ATTRIBUTE = "data-theme";

export const DEFAULT_COLOR_SCHEME: ColorScheme = "system";

export function isColorScheme(value: string | undefined): value is ColorScheme {
  return value !== undefined && (COLOR_SCHEMES as readonly string[]).includes(value);
}
