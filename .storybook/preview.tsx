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

// The production stylesheet, unmodified: Cosmos, then the Angeronia theme
// layer, then site composition. Never a Storybook-only variant (plan §6.1).
import "../app/slds.css";

import { COLOR_SCHEME_CLASS, type ColorScheme } from "../lib/slds/scheme";

/**
 * Puts the chosen `slds-color-scheme_*` class on `<html>`, which is the only
 * thing SLDS 2 needs to switch schemes — every colour token is a `light-dark()`
 * pair resolved by CSS `color-scheme`.
 */
const withColorScheme: Decorator = (Story, context) => {
  const scheme = (context.globals.colorScheme ?? "light") as ColorScheme;

  React.useEffect(() => {
    const root = document.documentElement;
    const classes = Object.values(COLOR_SCHEME_CLASS);
    root.classList.remove(...classes);
    root.classList.add(COLOR_SCHEME_CLASS[scheme]);
    return () => root.classList.remove(COLOR_SCHEME_CLASS[scheme]);
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
    // Surfaces come from the theme's hooks, so a backgrounds addon would only
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
      description: "SLDS colour scheme",
      toolbar: {
        title: "Scheme",
        icon: "sun",
        items: [
          { value: "light", title: "Light", icon: "sun" },
          { value: "dark", title: "Dark", icon: "moon" },
          { value: "system", title: "System", icon: "browser" },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [withColorScheme],
};

export default preview;
