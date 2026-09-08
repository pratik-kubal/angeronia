import { addons } from "storybook/manager-api";
import { create } from "storybook/theming";

/**
 * Storybook's own chrome, coloured from the design system so the shell around
 * a component does not fight the component.
 *
 * These are literal hexes on purpose: the manager iframe is outside the
 * document the theme layer styles, so it cannot read `--slds-*`. The values
 * are the resolved Angeronia hooks, listed in
 * `docs/design-system/theme-report.md`.
 */
addons.setConfig({
  theme: create({
    base: "light",
    brandTitle: "Angeronia Design System",
    brandUrl: "https://angeronia.com",
    colorPrimary: "#007d79", // accent-container-1 — Teal 60
    colorSecondary: "#005d5d", // accent-2 light — Teal 70
    appBg: "#f3f3f3", // surface-2 light
    appContentBg: "#ffffff", // surface-1 light
    textColor: "#081a1c", // on-surface-3 light — Teal 100
    fontBase: '"IBM Plex Sans", system-ui, sans-serif',
    fontCode: '"IBM Plex Mono", Consolas, monospace',
  }),
});
