import type { StorybookConfig } from "@storybook/nextjs-vite";
import { existsSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * Every game's Add to Home Screen icon, which Next serves from
 * `app/<route>/apple-icon.png` by file convention rather than from `public/`.
 * The home page's games launcher shows them (ADR-020), so Storybook serves each
 * at the same URL. Found by listing `app/`, so a new game needs no entry here.
 */
const APP = fileURLToPath(new URL("../app/", import.meta.url));
const gameIcons = readdirSync(APP, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && existsSync(`${APP}${entry.name}/apple-icon.png`))
  .map((entry) => ({
    from: `../app/${entry.name}/apple-icon.png`,
    to: `/${entry.name}/apple-icon.png`,
  }));

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
  staticDirs: ["../public", ...gameIcons],
  typescript: {
    // The components are the contract; their prop types should appear in docs
    // exactly as written rather than as inferred react-docgen approximations.
    reactDocgen: "react-docgen-typescript",
  },
  viteFinal: async (viteConfig) => {
    // Carbon is Sass; Vite picks up sass-embedded automatically. Mute the
    // deprecation warnings that originate inside node_modules, which we cannot
    // act on — the same `quietDeps` the Next build sets in `next.config.mjs`.
    viteConfig.css = {
      ...viteConfig.css,
      preprocessorOptions: {
        ...viteConfig.css?.preprocessorOptions,
        scss: { ...(viteConfig.css?.preprocessorOptions?.scss ?? {}), quietDeps: true },
      },
    };
    return viteConfig;
  },
};

export default config;
