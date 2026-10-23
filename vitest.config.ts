import { defineConfig } from "vitest/config";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));

/**
 * Two projects.
 *
 * `storybook` runs every story headlessly in Chromium: the play functions as
 * interaction tests, and `addon-a11y`'s axe pass as an accessibility gate
 * (`a11y: { test: "error" }` in `.storybook/preview.tsx` makes a violation a
 * failure rather than a note).
 *
 * `unit` runs the games' co-located `*.test.ts` in node (DECISIONS.md ADR-019).
 * The Playwright specs in `e2e/` run through `npm run test:e2e`, not Vitest.
 */
export default defineConfig({
  resolve: {
    alias: { "@": here },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "node",
          include: ["{app,components,lib,scripts}/**/*.test.ts", "*.test.ts"],
        },
      },
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
