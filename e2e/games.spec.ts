import { test, expect } from "@playwright/test";
import { games } from "../data/angeronia";

// The /games launcher, the games' home screen (DECISIONS.md ADR-021), the redirects from the games'
// old paths, and each game's way back to it. Runs on desktop Chromium and on an iPhone in WebKit.

test.beforeEach(async ({ page }) => {
  // The dev server's Next.js badge sits over Solitaire's menu button (as in solitaire.spec.ts).
  await page.addInitScript(() => {
    document.addEventListener("DOMContentLoaded", () => {
      const style = document.createElement("style");
      style.textContent = "nextjs-portal { display: none !important; }";
      document.head.appendChild(style);
    });
  });
});

test.describe("Games launcher", () => {
  test("shows every game's icon and name, saves as a web app, and is noindex", async ({ page }) => {
    await page.goto("/games");
    await expect(page.locator("meta[name='robots']")).toHaveAttribute("content", /noindex/);
    await expect(page.locator("meta[name='apple-mobile-web-app-capable']")).toHaveAttribute("content", "yes");
    await expect(page.locator("meta[name='apple-mobile-web-app-title']")).toHaveAttribute("content", "Games");
    await expect(page.locator("link[rel='apple-touch-icon']")).toHaveAttribute("href", /^\/games\/apple-icon\.png/);
    await expect(page.getByRole("heading", { level: 1, name: "Games" })).toBeAttached();

    await expect(page.getByRole("main").getByRole("link")).toHaveCount(games.length);
    for (const game of games) {
      const link = page.getByRole("link", { name: game.name, exact: true });
      await expect(link).toHaveAttribute("href", game.href);
      await expect(link).toBeInViewport();
      // The icon really loaded: a broken image has no natural size.
      const loaded = await link.locator("img").evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0);
      expect(loaded).toBe(true);
    }
  });

  test("opens each game from its icon", async ({ page }) => {
    for (const game of games) {
      await page.goto("/games");
      await page.getByRole("link", { name: game.name, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`${game.href}$`));
      await expect(page.locator("main#main")).toBeVisible();
    }
  });

  test("redirects the games' old paths for good", async ({ request }) => {
    for (const [from, to] of [
      ["/sudoku", "/games/sudoku"],
      ["/solitaire", "/games/solitaire"],
      ["/Solitaire", "/games/solitaire"],
    ]) {
      const res = await request.get(from, { maxRedirects: 0 });
      expect(res.status(), from).toBe(308);
      expect(res.headers()["location"], from).toBe(to);
    }
  });

  test("each game leads back to the launcher", async ({ page }) => {
    // Saved to a home screen there is no back button, so each game carries its own way back.
    await page.goto("/games/sudoku");
    await expect(page.getByRole("link", { name: "All games" })).toHaveAttribute("href", "/games");

    await page.goto("/games/solitaire");
    await page.waitForSelector(".sol-table[data-ready]");
    await page.getByRole("button", { name: "Menu" }).click();
    await expect(page.getByRole("dialog", { name: "Menu" }).getByRole("link", { name: "All games" })).toHaveAttribute("href", "/games");

    await page.goto("/games/lamplighter");
    await expect(page.getByRole("link", { name: "All games" })).toHaveAttribute("href", "/games");
  });
});
