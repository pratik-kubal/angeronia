import { test, expect, type Page } from "@playwright/test";
import { deal } from "../lib/solitaire/deal";
import { DEALS } from "../lib/solitaire/deals";
import { parseSaved, replay, toSaved, type GameState } from "../lib/solitaire/game";
import { solve } from "../lib/solitaire/solver";
import { bestTarget } from "../lib/solitaire/targets";

// Solitaire (/solitaire, and /Solitaire). Runs on desktop Chromium, on an iPhone upright and on its
// side and on an iPad in WebKit (playwright.config.ts). The game lives in localStorage
// ("solitaire:game": its seed and moves), so the specs set positions up from the domain code
// (lib/solitaire) and read the moves back.

const SEED = DEALS[0];
const SOLUTION = (() => {
  const result = solve(deal(SEED), { maxNodes: 250_000 });
  if (result.status !== "won") throw new Error("the first banked deal must solve");
  return result.moves;
})();
/** The solution's first move off the waste, and the position just before it. */
const WASTE_AT = SOLUTION.findIndex((t) => t[0] === "w");

const saved = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem("solitaire:game")!)).then((v) => parseSaved(v)!);
/** Waits for every card to land. */
const settled = (page: Page) => page.waitForFunction(() => document.getAnimations().length === 0, null, { timeout: 10_000 });
const card = (page: Page, id: number) => page.locator(`[data-card="${id}"]`);

/**
 * Opens the game at a position. Storage is written from a same-origin page without the game (the
 * game saves itself as it unloads, which would overwrite it).
 */
async function open(page: Page, state?: GameState, extra: Record<string, string> = {}, path = "/solitaire") {
  await page.goto("/solitaire/cards/v1/AS.webp");
  await page.evaluate(
    ([game, more]) => {
      if (game) localStorage.setItem("solitaire:game", game);
      for (const [k, v] of Object.entries(more)) localStorage.setItem(k, v);
    },
    [state ? JSON.stringify(toSaved(state)) : null, extra] as const,
  );
  await page.goto(path);
  await page.waitForSelector(".sol-table[data-ready]");
  await settled(page);
}

/** Plays the winning move of SEED's solution (all but it already played). */
async function win(page: Page, extra: Record<string, string> = {}) {
  const before = replay(SEED, SOLUTION.slice(0, -1)).state;
  await open(page, before, extra);
  const last = SOLUTION[SOLUTION.length - 1];
  const lead = last[0] === "w" ? before.table.waste.at(-1)! : before.table.tableau[Number(last[1])].up.at(-1)!;
  await card(page, lead).click();
}

test.beforeEach(async ({ page }) => {
  // The dev server's Next.js badge sits over the menu button.
  await page.addInitScript(() => {
    document.addEventListener("DOMContentLoaded", () => {
      const style = document.createElement("style");
      style.textContent = "nextjs-portal { display: none !important; }";
      document.head.appendChild(style);
    });
  });
});

test.describe("Solitaire", () => {
  test("serves /solitaire and /Solitaire, noindex, on one screen", async ({ page }) => {
    const lower = await page.goto("/solitaire");
    expect(lower?.status()).toBe(200);
    const upper = await page.goto("/Solitaire");
    expect(upper?.status()).toBe(200);
    expect(new URL(page.url()).pathname).toBe("/Solitaire");
    await expect(page.locator("meta[name='robots']")).toHaveAttribute("content", /noindex/);
    await page.waitForSelector(".sol-table[data-ready]");
    await settled(page);
    // One screen: no scrolling, every slot and control in view.
    const fits = await page.evaluate(() => document.scrollingElement!.scrollHeight <= innerHeight && document.scrollingElement!.scrollWidth <= innerWidth);
    expect(fits).toBe(true);
    for (const slot of ["s", "w", "f0", "f1", "f2", "f3", "t0", "t1", "t2", "t3", "t4", "t5", "t6"])
      await expect(page.locator(`[data-slot="${slot}"]`)).toBeInViewport({ ratio: 0.99 });
    await expect(page.getByRole("button", { name: "Menu" })).toBeInViewport({ ratio: 0.99 });
    // A phone on its side plays the rails; everything else the classic layout.
    const { width, height } = page.viewportSize()!;
    await expect(page.locator(".sol-table")).toHaveAttribute("data-arrangement", width > height && height < 500 ? "rails" : "classic");
  });

  test("deals a banked deal with every face loaded, and the stock turns three, fanned", async ({ page }) => {
    await open(page);
    const game = await saved(page);
    expect(DEALS).toContain(game.seed);
    const loaded = await page.$$eval(".sol-face", (imgs) => imgs.filter((i) => (i as HTMLImageElement).naturalWidth > 0).length);
    expect(loaded).toBe(52);
    await page.locator('[data-slot="s"]').click({ force: true, position: { x: 12, y: 12 } });
    await settled(page);
    const after = await saved(page);
    expect(after.log).toEqual(["s"]);
    const boxes = await Promise.all(after.table.waste.map((c) => card(page, c).boundingBox()));
    const portrait = (await page.locator(".sol-table").getAttribute("data-arrangement")) === "classic";
    const along = boxes.map((b) => (portrait ? b!.x : b!.y));
    expect(along[0]).toBeLessThan(along[1]);
    expect(along[1]).toBeLessThan(along[2]);
    await expect(card(page, after.table.waste[2])).toHaveAttribute("data-up", "1");
    await expect(card(page, after.table.waste[2])).toHaveAccessibleName(/ of /);
  });

  test("a tap on the top waste card flies it to where it fits", async ({ page }) => {
    const before = replay(SEED, SOLUTION.slice(0, WASTE_AT)).state;
    await open(page, before);
    const top = before.table.waste.at(-1)!;
    const to = bestTarget(before.table, "w", 1)!;
    const start = (await card(page, top).boundingBox())!;
    await card(page, top).click();
    await expect.poll(() => page.evaluate(() => document.getAnimations().length)).toBeGreaterThan(0);
    await settled(page);
    expect((await saved(page)).log.at(-1)).toBe(`w${to}`);
    const end = (await card(page, top).boundingBox())!;
    const slot = (await page.locator(`[data-slot="${to}"]`).boundingBox())!;
    expect(end.x !== start.x || end.y !== start.y).toBe(true);
    expect(Math.abs(end.x - slot.x)).toBeLessThan(2);
  });

  test("drags a card onto a column it fits; an illegal drop flies home", async ({ page, isMobile }) => {
    test.skip(isMobile, "drag is checked with a mouse on desktop");
    const at = SOLUTION.findIndex((t) => /^t\dt\d$/.test(t));
    const before = replay(SEED, SOLUTION.slice(0, at)).state;
    await open(page, before);
    const from = Number(SOLUTION[at][1]);
    const to = Number(SOLUTION[at][3]);
    const result = replay(SEED, SOLUTION.slice(0, at + 1)).state;
    const count = before.table.tableau[from].up.length - result.table.tableau[from].up.length + (result.table.tableau[from].down.length < before.table.tableau[from].down.length ? 1 : 0);
    const lead = before.table.tableau[from].up[before.table.tableau[from].up.length - count];
    const dest = [...before.table.tableau[to].down, ...before.table.tableau[to].up];
    const a = (await card(page, lead).boundingBox())!;
    const b = (await (dest.length ? card(page, dest.at(-1)!) : page.locator(`[data-slot="t${to}"]`)).boundingBox())!;
    await page.mouse.move(a.x + a.width / 2, a.y + 10);
    await page.mouse.down();
    await page.mouse.move(a.x + a.width / 2 + 20, a.y + 30, { steps: 4 });
    await page.mouse.move(b.x + b.width / 2, b.y + 30, { steps: 10 });
    await expect(page.locator(`[data-slot="t${to}"][data-over]`)).toHaveCount(1);
    await page.mouse.up();
    await settled(page);
    expect((await saved(page)).log.at(-1)).toBe(SOLUTION[at]);

    // Dropped on the bare felt, a card goes back where it was.
    const now = await saved(page);
    const top = now.table.tableau.map((c) => c.up.at(-1)).find((c) => c !== undefined)!;
    const home = (await card(page, top).boundingBox())!;
    await page.mouse.move(home.x + home.width / 2, home.y + home.height - 8);
    await page.mouse.down();
    await page.mouse.move(home.x + 40, home.y + 60, { steps: 4 });
    const view = page.viewportSize()!;
    await page.mouse.move(view.width / 2, view.height - 90, { steps: 8 });
    await page.mouse.up();
    await settled(page);
    expect((await saved(page)).log).toEqual(now.log);
    const back = (await card(page, top).boundingBox())!;
    expect(Math.abs(back.x - home.x) + Math.abs(back.y - home.y)).toBeLessThan(1);
  });

  test("Hint marks a move, Undo takes one back, and a reload resumes every card where it was", async ({ page }) => {
    const before = replay(SEED, SOLUTION.slice(0, WASTE_AT + 3)).state;
    await open(page, before);
    await page.getByRole("button", { name: "Hint" }).click();
    await expect(page.locator('[data-hint="from"]').first()).toBeVisible();
    await page.locator('[data-slot="s"]').click({ force: true, position: { x: 12, y: 12 } });
    await settled(page);
    expect((await saved(page)).log).toHaveLength(before.log.length + 1);
    await page.getByRole("button", { name: "Undo" }).click();
    await settled(page);
    const undone = await saved(page);
    expect(undone.log).toEqual(before.log);
    const places = () => page.$$eval(".sol-card", (els) => els.map((e) => (e as HTMLElement).style.transform).join("|"));
    const was = await places();
    await page.reload();
    await page.waitForSelector(".sol-table[data-ready]");
    await settled(page);
    expect((await saved(page)).log).toEqual(before.log);
    expect(await places()).toBe(was);
  });

  test("a win plays the next win show, and a tap skips to the result", async ({ page, isMobile }) => {
    await win(page);
    await expect(page.locator('canvas.sol-fx[data-fx="cascade"]')).toBeVisible();
    await expect(page.locator(".sol-card").first()).toBeHidden();
    // Near the top, where the result sheet's backdrop comes up under the finger: the tap that
    // skips must not close the sheet it opens.
    const near = { position: { x: 40, y: 24 } };
    if (isMobile) await page.locator("canvas.sol-fx").tap(near);
    else await page.locator("canvas.sol-fx").click(near);
    const result = page.getByRole("dialog", { name: "Result" });
    await expect(result).toBeVisible();
    await page.waitForTimeout(500);
    await expect(result).toBeVisible();
    await expect(result.getByRole("heading")).toHaveText("Solved, the classic way");
    await expect(result.getByText("Won", { exact: true })).toBeVisible();
    const stats = await page.evaluate(() => JSON.parse(localStorage.getItem("solitaire:stats")!));
    expect(stats).toMatchObject({ won: 1, streak: 1 });
    expect(await page.evaluate(() => localStorage.getItem("solitaire:fx"))).toBe("1");
  });

  test("each win plays the next show: fountain, spiral, waterfall", async ({ page }) => {
    for (const [i, kind] of [[1, "fountain"], [2, "spiral"], [3, "waterfall"]] as const) {
      await win(page, { "solitaire:fx": String(i) });
      await expect(page.locator(`canvas.sol-fx[data-fx="${kind}"]`)).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog", { name: "Result" })).toBeVisible();
    }
    expect(await page.evaluate(() => localStorage.getItem("solitaire:fx"))).toBe("0");
  });

  test("with reduced motion, nothing flies and a win goes straight to the result", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await open(page);
    expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
    await win(page);
    await expect(page.getByRole("dialog", { name: "Result" })).toBeVisible();
    await expect(page.locator("canvas.sol-fx")).toHaveCount(0);
  });

  test("two tabs: the one in use owns the game, and the other follows it", async ({ page, context }) => {
    await open(page);
    const other = await context.newPage();
    await other.goto("/solitaire");
    await other.waitForSelector(".sol-table[data-ready]");
    await settled(other);
    await other.locator('[data-slot="s"]').click({ force: true, position: { x: 12, y: 12 } });
    await settled(other);
    const moved = await saved(other);
    expect(moved.log).toEqual(["s"]);
    // The first tab shows the move and doesn't save over it.
    await expect(card(page, moved.table.waste[2])).toHaveAttribute("data-up", "1");
    await page.waitForTimeout(1500);
    expect((await saved(page)).log).toEqual(["s"]);
  });

  test("two tabs: a new game in one closes the other's result", async ({ page, context }) => {
    await win(page);
    await page.locator("canvas.sol-fx").click({ position: { x: 40, y: 24 } });
    await expect(page.getByRole("dialog", { name: "Result" })).toBeVisible();
    const other = await context.newPage();
    await other.goto("/solitaire");
    await other.waitForSelector(".sol-table[data-ready]");
    await expect(other.getByRole("dialog", { name: "Result" })).toBeVisible();
    await page.getByRole("dialog", { name: "Result" }).getByRole("button", { name: "New game" }).click();
    await expect(page.getByRole("dialog", { name: "Result" })).toBeHidden();
    await expect(other.getByRole("dialog", { name: "Result" })).toBeHidden();
    await expect.poll(async () => (await saved(other)).seed).not.toBe(SEED);
  });

  test("keys: D turns the stock, U undoes, H hints", async ({ page, isMobile }) => {
    test.skip(isMobile, "keys are for desktops");
    await open(page);
    await page.keyboard.press("d");
    await settled(page);
    expect((await saved(page)).log).toEqual(["s"]);
    await page.keyboard.press("u");
    await settled(page);
    expect((await saved(page)).log).toEqual([]);
    await page.keyboard.press("h");
    await expect(page.locator("[data-hint]").first()).toBeVisible();
  });

  test("keys: Space turns the stock, but presses a focused button as its own", async ({ page, isMobile }) => {
    test.skip(isMobile, "keys are for desktops");
    await open(page);
    await page.keyboard.press(" ");
    await settled(page);
    expect((await saved(page)).log).toEqual(["s"]);
    await page.getByRole("button", { name: "Undo" }).focus();
    await page.keyboard.press(" ");
    await settled(page);
    expect((await saved(page)).log).toEqual([]);
  });

  test("keys: the playable cards are one Tab stop, and the arrows walk them in table order", async ({ page, isMobile }) => {
    test.skip(isMobile, "keys are for desktops");
    const before = replay(SEED, SOLUTION.slice(0, WASTE_AT)).state;
    await open(page, before);
    const t = before.table;
    const order = [...t.waste.slice(-1), ...t.foundations.flatMap((f) => f.slice(-1)), ...t.tableau.flatMap((c) => c.up)];
    await expect(page.locator('.sol-card[tabindex="0"]')).toHaveCount(1);
    await page.locator('[data-slot="s"]').focus();
    await page.keyboard.press("Tab");
    await expect(card(page, order[0])).toBeFocused();
    for (const next of order.slice(1)) {
      await page.keyboard.press("ArrowRight");
      await expect(card(page, next)).toBeFocused();
    }
    await page.keyboard.press("Home");
    await expect(card(page, order[0])).toBeFocused();
    await page.keyboard.press("End");
    await expect(card(page, order.at(-1)!)).toBeFocused();
    // The card focused last keeps the Tab stop, and Tab leaves the cards for the controls.
    await expect(page.locator('.sol-card[tabindex="0"]')).toHaveCount(1);
    await expect(card(page, order.at(-1)!)).toHaveAttribute("tabindex", "0");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Menu" })).toBeFocused();
  });
});
