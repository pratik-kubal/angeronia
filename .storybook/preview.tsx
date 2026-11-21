import * as React from "react";
import type { Decorator, Preview } from "@storybook/nextjs-vite";

// The same two families `next/font` self-hosts in production, wired up for stories.
import "@fontsource-variable/imbue/opsz.css";
import "@fontsource/albert-sans/400.css";
import "@fontsource/albert-sans/500.css";
import "@fontsource/albert-sans/600.css";

// The production stylesheets, unmodified. Never a Storybook-only variant.
import "../styles/tokens.css";
import "../styles/base.css";
import "../styles/motion.css";
import "./preview.css";

/**
 * Every story renders inside `.studio`, as every studio page does, so it gets
 * the tokens, the base and the helpers. Stories never get the `js` class, so
 * nothing is hidden waiting to arrive and axe sees the finished state.
 */
const withStudio: Decorator = (Story) => (
  <div className="studio">
    <Story />
  </div>
);

const preview: Preview = {
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    // Surfaces come from the tokens, so a backgrounds addon would only let a
    // reviewer put a component on a ground the page never uses.
    backgrounds: { disable: true },
    a11y: { test: "error" },
    docs: { toc: true },
    options: {
      storySort: {
        order: ["Foundations", "Components", "Sections", "Pages"],
      },
    },
  },
  decorators: [withStudio],
};

export default preview;
