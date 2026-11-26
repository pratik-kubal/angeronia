import { addons } from "storybook/manager-api";
import { create } from "storybook/theming";

/**
 * Storybook's own chrome, coloured from the spine's palette so the shell around
 * a component does not fight the component.
 *
 * Literal hexes on purpose: the manager is a separate document that
 * styles/tokens.css never reaches. The values are --palette-ink,
 * --palette-paper and --palette-ink-soft.
 */
addons.setConfig({
  theme: create({
    base: "light",
    brandTitle: "Angeronia Labs — the spine",
    brandUrl: "https://angeronia.com",
    colorPrimary: "#1c1c1c",
    colorSecondary: "#5c5d58",
    appBg: "#f1f1ef",
    appContentBg: "#f1f1ef",
    textColor: "#1c1c1c",
    fontBase: '"Hanken Grotesk", "Helvetica Neue", Arial, sans-serif',
    fontCode: '"IBM Plex Mono", ui-monospace, Menlo, monospace',
  }),
});
