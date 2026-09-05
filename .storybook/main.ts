import type { StorybookConfig } from "@storybook/nextjs-vite";

/**
 * Storybook is the design source of truth for this repo (D4): every component
 * has a story before it appears on a page, and the page itself is a story.
 */
const config: StorybookConfig = {
  stories: [
    "../stories/**/*.mdx",
    "../stories/**/*.stories.@(ts|tsx)",
    "../components/**/*.stories.@(ts|tsx)",
  ],
  addons: [
    "@storybook/addon-docs",
    "@storybook/addon-a11y",
    "@storybook/addon-links",
    "@storybook/addon-vitest",
  ],
  framework: {
    name: "@storybook/nextjs-vite",
    options: {},
  },
  staticDirs: ["../public"],
  typescript: {
    // The components are the contract; their prop types should appear in docs
    // exactly as written rather than as inferred react-docgen approximations.
    reactDocgen: "react-docgen-typescript",
  },
};

export default config;
