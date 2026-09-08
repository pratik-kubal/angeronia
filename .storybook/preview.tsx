import * as React from "react";
import type { Decorator, Preview } from "@storybook/nextjs-vite";

// The same faces `next/font` self-hosts in production, wired up for stories.
import "@fontsource/ibm-plex-sans/latin-300.css";
import "@fontsource/ibm-plex-sans/latin-400.css";
import "@fontsource/ibm-plex-sans/latin-600.css";
import "@fontsource/ibm-plex-sans/latin-700.css";
import "@fontsource/ibm-plex-mono/latin-400.css";
import "./preview.css";
import "./foundations.css";

// The production stylesheet, unmodified: Carbon, then the Angeronia theme,
// then site composition. Never a Storybook-only variant (design rule 11).
import "../styles/globals.scss";

import { COLOR_SCHEME_ATTRIBUTE, type SelectableColorScheme } from "../lib/theme";

/**
 * Puts the chosen theme on `<html>`, which is the only thing Carbon needs to
 * switch schemes — `styles/_themes.scss` emits the White token set under
 * `:root` and the Gray 100 set under `:root[data-theme="dark"]`.
 *
 * `colorScheme` is also set so the browser's own chrome (form controls,
 * scrollbars) follows, which is what `next-themes` does in production.
 */
const withColorScheme: Decorator = (Story, context) => {
  const scheme = (context.globals.colorScheme ?? "light") as SelectableColorScheme;

  React.useEffect(() => {
    const root = document.documentElement;
    root.setAttribute(COLOR_SCHEME_ATTRIBUTE, scheme);
    root.style.colorScheme = scheme;
    return () => {
      root.removeAttribute(COLOR_SCHEME_ATTRIBUTE);
      root.style.colorScheme = "";
    };
  }, [scheme]);

  return (
    <div className="site-root sb-surface">
      <Story />
    </div>
  );
};

const preview: Preview = {
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    // Surfaces come from the theme's tokens, so a backgrounds addon would only
    // let a reviewer put a component on a ground the design system never uses.
    backgrounds: { disable: true },
    a11y: { test: "error" },
    docs: { toc: true },
    options: {
      storySort: {
        order: [
          "Foundations",
          ["Introduction", "Brand", "Color", "Typography"],
          "Components",
          "Sections",
          "Pages",
        ],
      },
    },
  },
  initialGlobals: {
    colorScheme: "light",
  },
  globalTypes: {
    colorScheme: {
      description: "Carbon theme",
      toolbar: {
        title: "Scheme",
        icon: "sun",
        items: [
          { value: "light", title: "Light · White", icon: "sun" },
          { value: "dark", title: "Dark · Gray 100", icon: "moon" },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [withColorScheme],
};

export default preview;
