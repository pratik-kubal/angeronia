import { defineConfig } from "vitest/config";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));

/**
 * Runs every story headlessly in Chromium: the play functions as interaction
 * tests, and `addon-a11y`'s axe pass as an accessibility gate
 * (`a11y: { test: "error" }` in `.storybook/preview.tsx` makes a violation a
 * failure rather than a note).
 */
export default defineConfig({
  resolve: {
    alias: { "@": here },
  },
  test: {
    projects: [
      {
        extends: true,
        plugins: [storybookTest({ configDir: resolve(here, ".storybook") })],
        test: {
          name: "storybook",
          browser: {
            enabled: true,
            headless: true,
            provider: "playwright",
            instances: [{ browser: "chromium" }],
          },
          setupFiles: [resolve(here, ".storybook/vitest.setup.ts")],
        },
      },
    ],
  },
});
