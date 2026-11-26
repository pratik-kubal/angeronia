import type { Decorator, Preview } from "@storybook/nextjs-vite";

// The production stylesheets, unmodified and in the layout's order: tokens,
// then base (DESIGN-RULES.md §1). Never a Storybook-only variant.
import "../styles/tokens.css";
import "../styles/base.css";
import "./preview.css";

// The same next/font faces app/layout.tsx loads. Their variables go on <html>,
// as in production: tokens.css reads them in :root, so a wrapper would be too
// low for --font-sans to see them.
import { fontVariables } from "../app/fonts";

document.documentElement.classList.add(...fontVariables.split(" "));

/** Which band a story renders on (DESIGN-RULES.md §11). */
type Band = "paper" | "dark" | false;

/**
 * Every story renders on a band, as every component does on the page: the
 * band sets the roles (`--band-*`), and the studio's focus ring and selection
 * are scoped to `[data-band]`. `parameters.band` picks it: "paper" (the
 * default), "dark" for the charcoal band, or `false` for a story that brings its
 * own bands (a page).
 */
const withBand: Decorator = (Story, context) => {
  const band = (context.parameters.band ?? "paper") as Band;
  if (band === false) return <Story />;
  return (
    <div data-band={band} className="sb-band">
      <Story />
    </div>
  );
};

const preview: Preview = {
  parameters: {
    layout: "fullscreen",
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    // One colour scheme (ADR-024), and grounds come from the band roles, so a
    // backgrounds addon would only put a component on a ground the site never uses.
    backgrounds: { disable: true },
    a11y: { test: "error" },
    docs: { toc: true },
    band: "paper",
    // The draft's three screenshot widths. A story picks one with
    // `globals: { viewport: { value: "phone", isRotated: false } }`.
    viewport: {
      options: {
        phone: { name: "Phone, 390", styles: { width: "390px", height: "844px" }, type: "mobile" },
        tablet: { name: "Tablet, 768", styles: { width: "768px", height: "1024px" }, type: "tablet" },
        desktop: { name: "Desktop, 1440", styles: { width: "1440px", height: "900px" }, type: "desktop" },
      },
    },
    options: {
      storySort: {
        order: ["Foundations", "Components", "Sections", "Pages"],
      },
    },
  },
  decorators: [withBand],
};

export default preview;
