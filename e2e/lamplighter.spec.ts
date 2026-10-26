import { test, expect, type Page } from "@playwright/test";

// Lamplighter (/games/lamplighter). Runs on desktop Chromium, and on an iPhone upright and on its
// side in WebKit (playwright.config.ts).

test.beforeEach(async ({ page }) => {
  // The dev server's Next.js badge sits over the game's corner buttons.
  await page.addInitScript(() => {
    document.addEventListener("DOMContentLoaded", () => {
      const style = document.createElement("style");
      style.textContent = "nextjs-portal { display: none !important; }";
      document.head.appendChild(style);
    });
  });
});

test("is noindex, saves as a web app and leads back to the launcher", async ({ page }) => {
  await page.goto("/games/lamplighter");
  await expect(page).toHaveTitle(/Lamplighter/);
  await expect(page.locator("meta[name='robots']")).toHaveAttribute("content", /noindex/);
  await expect(page.locator("meta[name='apple-mobile-web-app-capable']")).toHaveAttribute("content", "yes");
  await expect(page.locator("meta[name='apple-mobile-web-app-title']")).toHaveAttribute("content", "Lamplighter");
  await expect(page.locator("link[rel='apple-touch-icon']")).toHaveAttribute("href", /^\/games\/lamplighter\/apple-icon\.png/);
  await expect(page.locator("main#main")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "Lamplighter" })).toBeVisible();
  await expect(page.getByRole("link", { name: "All games" })).toHaveAttribute("href", "/games");
});

type Hook = {
  state(): { tick: number; phase: string; s: number; x: number; h: number; air: boolean; dips: number; glow: number } | null;
  speed(k: number): void;
  autopilot(kind: "skilled" | "casual" | null): void;
};
const hook = (page: Page) => ({
  state: () => page.evaluate(() => (window as unknown as { __lamplighter: Hook }).__lamplighter.state()!),
  speed: (k: number) => page.evaluate((k) => (window as unknown as { __lamplighter: Hook }).__lamplighter.speed(k), k),
  autopilot: (kind: "skilled" | null) => page.evaluate((kind) => (window as unknown as { __lamplighter: Hook }).__lamplighter.autopilot(kind), kind),
  until: (test: string, timeout = 30_000) =>
    page.waitForFunction(`(() => { const s = window.__lamplighter?.state(); return !!s && (${test}); })()`, null, { timeout, polling: "raf" }),
});

/** Opens the game and starts First Light, waiting for Go. */
async function fly(page: Page) {
  await page.goto("/games/lamplighter");
  await page.getByRole("button", { name: "Play" }).click();
  await expect(page.locator(".lmp-stage")).toHaveAttribute("data-phase", "countdown");
  await hook(page).until("s.phase === 'running'", 10_000);
}

test.describe("by keyboard", () => {
  test.skip(({ isMobile }) => isMobile, "a phone has no keyboard");

  test("steers, hops, pauses and resumes", async ({ page }) => {
    await fly(page);
    const h = hook(page);
    await page.keyboard.down("ArrowRight");
    await h.until("s.x > 0.5", 5_000);
    await page.keyboard.up("ArrowRight");

    await page.keyboard.press("Space");
    await h.until("s.air", 2_000);

    await page.keyboard.press("Escape");
    const sheet = page.getByRole("dialog", { name: "Paused" });
    await expect(sheet).toBeVisible();
    await expect(page.locator(".lmp-stage")).toHaveAttribute("data-phase", "paused");
    const tick = (await h.state()).tick;
    await page.waitForTimeout(300);
    expect((await h.state()).tick).toBe(tick);

    await sheet.getByRole("button", { name: "Keep flying" }).click();
    await expect(sheet).toBeHidden();
    await expect(page.locator(".lmp-stage")).toHaveAttribute("data-phase", "running");
    await expect(page.locator(".lmp-stage")).toBeFocused();
    expect((await h.state()).tick).toBeGreaterThan(tick);
  });

  test("hops the tutorial's first gap", async ({ page }) => {
    await fly(page);
    const h = hook(page);
    // Fly most of the way on autopilot, then take over before the gap at 290 m.
    await h.autopilot("skilled");
    await h.speed(4);
    await h.until("s.s > 240");
    await h.autopilot(null);
    await h.speed(1);
    await h.until("s.s >= 287");
    await page.keyboard.press("Space");
    await h.until("s.s > 300");
    expect((await h.state()).dips).toBe(0);
  });
});

test("flies First Light to the lantern and earns its flames", async ({ page }) => {
  await fly(page);
  const h = hook(page);
  await h.autopilot("skilled");
  await h.speed(8);
  const results = page.getByRole("region", { name: "First Light: the lantern is lit" });
  await expect(results).toBeVisible({ timeout: 30_000 });
  await expect(results.locator("li[data-earned]")).toHaveCount(3);
  await expect(page.locator(".lmp-stage")).toHaveAttribute("data-phase", "finished");

  await results.getByRole("button", { name: "Fly again" }).click();
  await expect(results).toBeHidden();
  await expect(page.locator(".lmp-stage")).toHaveAttribute("data-phase", "countdown");
  await page.getByRole("button", { name: "Pause" }).click();
  await page.getByRole("dialog", { name: "Paused" }).getByRole("button", { name: "Leave the route" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Lamplighter" })).toBeVisible();
});
