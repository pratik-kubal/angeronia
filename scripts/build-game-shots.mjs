#!/usr/bin/env node
// Regenerates the two screenshots the home page's Games section shows,
// `public/games/sudoku.jpg` and `public/games/solitaire.jpg` (ADR-020).
//
// They are pictures of the real games, taken from a running server rather than
// redrawn, because the games' look lives in their own CSS and the studio site
// may not import it (ADR-019). Both are taken in the same 4:3 landscape viewport,
// in the light scheme and with reduced motion (so no deal or scene is caught
// mid-flight), so the pair crops alike on the page. Each deal is random, so a
// re-run gives a different board; the page does not depend on which.
//
// Needs a server: `npm run build && npm start` (the dev server works too; its
// badge is hidden) and Playwright's Chromium (`npx playwright install chromium`).
//
//   node scripts/build-game-shots.mjs [base-url]   # default http://localhost:3000

import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "playwright";

const BASE = process.argv[2] ?? "http://localhost:3000";
const OUT = resolve(import.meta.dirname, "../public/games");

// 4:3, at the size the page draws them on a 2x screen. Keep in step with the
// `width` / `height` in data/angeronia.ts.
const VIEWPORT = { width: 1200, height: 900 };
const QUALITY = 82;

const SHOTS = [
  {
    file: "sudoku.jpg",
    path: "/sudoku",
    async ready(page) {
      // A first visit opens on the New game sheet; start an easy board and select
      // a cell, so the shot shows a game in progress with its row and column lit.
      await page.getByRole("button", { name: /^Easy/ }).click();
      await page.getByRole("dialog", { name: "New game" }).waitFor({ state: "hidden" });
      await page.getByRole("button", { name: /^Row 5, column 5,/ }).click();
    },
  },
  {
    file: "solitaire.jpg",
    path: "/solitaire",
    async ready(page) {
      await page.locator(".sol-table[data-ready]").waitFor();
    },
  },
];

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();

for (const shot of SHOTS) {
  const context = await browser.newContext({
    viewport: VIEWPORT,
    colorScheme: "light",
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.goto(BASE + shot.path, { waitUntil: "networkidle" });
  // The dev server's badge is not part of either game.
  await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
  await shot.ready(page);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: resolve(OUT, shot.file), type: "jpeg", quality: QUALITY });
  console.log(`✓ public/games/${shot.file}`);
  await context.close();
}

await browser.close();
