import { addons } from "storybook/manager-api";
import { create } from "storybook/theming";

/**
 * Storybook's own chrome, coloured from the design system so the shell around
 * a component does not fight the component.
 *
 * These are literal hexes on purpose: the manager iframe is outside the
 * document the theme styles, so it cannot read `--cds-*`. The values are the
 * resolved Carbon White tokens and the Angeronia teal.
 */
addons.setConfig({
  theme: create({
    base: "light",
    brandTitle: "Angeronia Design System",
    brandUrl: "https://angeronia.com",
    colorPrimary: "#007d79", // Teal 60 — $background-brand
    colorSecondary: "#005d5d", // Teal 70 — $link-primary-hover
    appBg: "#f4f4f4", // Gray 10 — $layer-01
    appContentBg: "#ffffff", // White — $background
    textColor: "#161616", // Gray 100 — $text-primary
    fontBase: '"IBM Plex Sans", system-ui, sans-serif',
    fontCode: '"IBM Plex Mono", Consolas, monospace',
  }),
});
