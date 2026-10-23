import { defineConfig, devices } from "@playwright/test";

// End-to-end tests for the games (DECISIONS.md ADR-019): Sudoku on desktop
// Chromium and on an iPhone in WebKit, the engine of every iOS browser. The
// studio pages are covered by the Storybook tests instead. Kept separate from
// `npm test` (Vitest). Run with `npm run test:e2e`; E2E_PORT picks another port
// when 3000 is taken (an existing dev server on that port is reused).
// First-time setup: `npx playwright install chromium webkit`.
const PORT = Number(process.env.E2E_PORT ?? 3000);

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "iphone", testMatch: /sudoku\.spec\.ts/, use: { ...devices["iPhone 15"] } },
  ],
  webServer: {
    command: `npm run dev -- --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
