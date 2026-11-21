import { addons } from "storybook/manager-api";
import { create } from "storybook/theming";

/**
 * Storybook's own chrome, in the site's palette so the shell around a
 * component does not fight the component.
 *
 * These are literal hexes on purpose: the manager is a separate document that
 * never loads styles/tokens.css, so it cannot read the custom properties. The
 * values are copied from that file: warm black, white and gold.
 */
addons.setConfig({
  theme: create({
    base: "dark",
    brandTitle: "Angeronia Labs",
    brandUrl: "https://angeronia.com",
    colorPrimary: "#c9a45a", // --accent
    colorSecondary: "#c9a45a", // --accent: the selected story and the active tab
    appBg: "#0c0a08", // --bg
    appContentBg: "#181512", // --surface
    appPreviewBg: "#0c0a08", // --bg
    barBg: "#181512", // --surface
    textColor: "#ffffff", // --ink
    textMutedColor: "#8f8a84", // --muted
    barTextColor: "#8f8a84", // --muted
    barSelectedColor: "#c9a45a", // --accent
    textInverseColor: "#0c0a08", // --accent-ink: text on a gold fill
    fontBase: '"Albert Sans", system-ui, -apple-system, "Segoe UI", sans-serif',
    fontCode: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
  }),
});
