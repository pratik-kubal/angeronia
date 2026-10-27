import { test, expect, type Page } from "@playwright/test";
import { PICTURES } from "../lib/color-tap/pictures";

// Color Tap (/games/paint-by-numbers, DECISIONS.md ADR-022) on desktop Chromium, and in WebKit on an
// iPhone 15 upright and on its side and an iPad. The painting lives in localStorage
// ("color-tap:works"); the page's development hook window.__colorTap gives the state and where each
// area's number is on screen, so the specs tap areas the way a player does (or play by keyboard).

type Area = { area: number; colour: number; x: number; y: number; size: number };
type State = { order: number[]; selected: number; magnifiers: number; auto: number; done: boolean; picture: string; level: string };

test.beforeEach(async ({ page }) => {
  // The dev server's Next.js badge sits over the paint box on a phone (as in the other specs).
  await page.addInitScript(() => {
    document.addEventListener("DOMContentLoaded", () => {
      const style = document.createElement("style");
      style.textContent = "nextjs-portal { display: none !important; }";
      document.head.appendChild(style);
    });
  });
});

const state = (page: Page): Promise<State> =>
  page.evaluate(() => {
    const s = (window as unknown as { __colorTap: { state(): State | null } }).__colorTap.state();
    if (!s) throw new Error("No painting");
    return { order: [...s.order], selected: s.selected, magnifiers: s.magnifiers, auto: s.auto, done: s.done, picture: s.picture, level: s.level };
  });

/** Every area, with where its number is on the page and how wide it is on screen, if the stage shows it and nothing covers it. */
const areas = (page: Page): Promise<Area[]> =>
  page.evaluate(() => {
    const hook = (window as unknown as { __colorTap: { puzzle(): { regions: { colour: number; labels: { x: number; y: number; r: number }[] }[] }; point(a: number): { x: number; y: number }; camera(): { scale: number } } }).__colorTap;
    const puzzle = hook.puzzle();
    const scale = hook.camera().scale;
    const canvas = document.querySelector("canvas.ctp-canvas");
    return puzzle.regions
      .map((r, area) => {
        const p = hook.point(area);
        return { area, colour: r.colour, x: p.x, y: p.y, size: 2 * r.labels[0].r * scale };
      })
      .filter((a) => document.elementFromPoint(a.x, a.y) === canvas);
  });

async function tap(page: Page, x: number, y: number, touch: boolean) {
  if (touch) await page.touchscreen.tap(x, y);
  else await page.mouse.click(x, y);
}

async function start(page: Page, picture: string, level: string) {
  await page.goto("/games/paint-by-numbers");
  const sheet = page.getByRole("dialog", { name: "New painting" });
  await expect(sheet).toBeVisible();
  await sheet.getByRole("radio", { name: new RegExp(`^${picture}`) }).click();
  await sheet.getByRole("radio", { name: new RegExp(`^${level},`) }).click();
  await sheet.getByRole("button", { name: /^(Start painting|Continue)/ }).click();
  await expect(sheet).toBeHidden();
  await page.waitForFunction(() => !!(window as unknown as { __colorTap?: { state(): unknown } }).__colorTap?.state());
  // Let the stage settle on the painting.
  await page.waitForTimeout(300);
}

/** Mean RGB difference (0–255) between two images drawn to the same small canvas. */
async function difference(page: Page, a: string, b: string): Promise<number> {
  return page.evaluate(
    async ([one, two]) => {
      const draw = async (source: string) => {
        const canvas = document.createElement("canvas");
        canvas.width = 120;
        canvas.height = 80;
        const ctx = canvas.getContext("2d")!;
        if (source.startsWith("canvas:")) {
          const el = document.querySelector<HTMLCanvasElement>(source.slice(7))!;
          ctx.drawImage(el, 0, 0, 120, 80);
        } else {
          const img = new Image();
          img.src = source;
          await img.decode();
          ctx.drawImage(img, 0, 0, 120, 80);
        }
        return ctx.getImageData(0, 0, 120, 80).data;
      };
      const x = await draw(one);
      const y = await draw(two);
      let sum = 0;
      for (let i = 0; i < x.length; i += 4) sum += Math.abs(x[i] - y[i]) + Math.abs(x[i + 1] - y[i + 1]) + Math.abs(x[i + 2] - y[i + 2]);
      return sum / ((x.length / 4) * 3);
    },
    [a, b],
  );
}

test.describe("Color Tap", () => {
  test("is a noindex web app on one screen, with a way back to the games", async ({ page }) => {
    await page.goto("/games/paint-by-numbers");
    await expect(page.locator("meta[name='robots']")).toHaveAttribute("content", /noindex/);
    await expect(page.locator("meta[name='apple-mobile-web-app-capable']")).toHaveAttribute("content", "yes");
    await expect(page.locator("meta[name='apple-mobile-web-app-title']")).toHaveAttribute("content", "Color Tap");
    await expect(page.locator("link[rel='apple-touch-icon']")).toHaveAttribute("href", /^\/games\/paint-by-numbers\/apple-icon\.png/);
    await expect(page.locator("main#main")).toBeVisible();
    const fits = await page.evaluate(() => document.scrollingElement!.scrollHeight <= window.innerHeight && document.scrollingElement!.scrollWidth <= window.innerWidth);
    expect(fits).toBe(true);
    await expect(page.getByRole("dialog", { name: "New painting" }).getByRole("link", { name: "All games" })).toHaveAttribute("href", "/games");
  });

  test("first opens New painting: every photo, five levels, and the chosen picture's blank sheet behind it", async ({ page }) => {
    await page.goto("/games/paint-by-numbers");
    const sheet = page.getByRole("dialog", { name: "New painting" });
    await expect(sheet).toBeVisible();
    // The first visit can't close it: there's nothing behind it to go back to.
    await expect(sheet.getByRole("button", { name: "Close" })).toHaveCount(0);
    await expect(sheet.getByRole("radiogroup", { name: "Picture" }).getByRole("radio")).toHaveCount(PICTURES.length);
    const levels = sheet.getByRole("radiogroup", { name: "Difficulty" }).getByRole("radio");
    await expect(levels).toHaveCount(5);
    for (const [i, name] of ["Easy", "Medium", "Hard", "Expert", "Master"].entries()) await expect(levels.nth(i)).toHaveAccessibleName(new RegExp(`^${name}, \\d+ colours, \\d+ areas, \\d magnifiers`));
    await expect(levels.nth(0)).toHaveAttribute("aria-checked", "true");

    // Behind it, the blank sheet: white paper, grey lines and numbers, no colour anywhere.
    await page.waitForSelector("main[data-ready]");
    await page.waitForTimeout(600);
    const sheetPixels = await page.evaluate(() => {
      const canvas = document.querySelector<HTMLCanvasElement>("canvas.ctp-canvas")!;
      const ctx = canvas.getContext("2d")!;
      const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let paper = 0;
      let coloured = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] < 250) continue;
        const max = Math.max(data[i], data[i + 1], data[i + 2]);
        const min = Math.min(data[i], data[i + 1], data[i + 2]);
        if (min > 245) paper++;
        // Anti-aliased grey lines stay grey; paint would be saturated.
        if (max - min > 40) coloured++;
      }
      return { paper, coloured };
    });
    expect(sheetPixels.paper).toBeGreaterThan(10_000);
    expect(sheetPixels.coloured).toBe(0);

    // Another level shows its own sheet and counts.
    const before = await page.evaluate(() => (window as unknown as { __colorTap: { puzzle(): { regions: unknown[] } } }).__colorTap.puzzle().regions.length);
    await sheet.getByRole("radio", { name: /^Hard,/ }).click();
    await expect(sheet.getByRole("radio", { name: /^Hard,/ })).toHaveAttribute("aria-checked", "true");
    await expect.poll(() => page.evaluate(() => (window as unknown as { __colorTap: { puzzle(): { regions: unknown[] } } }).__colorTap.puzzle().regions.length)).toBeGreaterThan(before);
  });

  test("paints an area of the selected colour where it's tapped, and only says so for another colour's", async ({ page, isMobile }) => {
    await start(page, PICTURES[0].title, "Easy");
    const s = await state(page);
    const all = await areas(page);
    const mine = all.filter((a) => a.colour === s.selected).sort((a, b) => b.size - a.size)[0];
    expect(mine).toBeTruthy();
    const total = (await page.evaluate(() => (window as unknown as { __colorTap: { puzzle(): { regions: { colour: number }[] } } }).__colorTap.puzzle().regions)).filter((r) => r.colour === s.selected).length;
    await tap(page, mine.x, mine.y, isMobile);
    await expect.poll(async () => (await state(page)).order).toEqual([mine.area]);
    await expect(page.getByRole("radio", { name: new RegExp(`^Colour ${s.selected + 1}, `) })).toHaveAccessibleName(`Colour ${s.selected + 1}, ${total - 1} of ${total} areas left`);

    // Another colour's area: nothing painted, the swatch it wants named.
    const other = all.filter((a) => a.colour !== s.selected && a.size > 30)[0];
    await tap(page, other.x, other.y, isMobile);
    await page.waitForTimeout(200);
    expect((await state(page)).order).toEqual([mine.area]);
    await expect(page.getByRole("status").filter({ hasText: `That area is colour ${other.colour + 1}` })).toBeAttached();

    // A reload comes back to the same painting, with nothing in the way.
    await page.waitForTimeout(400);
    await page.reload();
    await page.waitForFunction(() => !!(window as unknown as { __colorTap?: { state(): unknown } }).__colorTap?.state());
    expect((await state(page)).order).toEqual([mine.area]);
    await expect(page.getByRole("dialog", { name: "New painting" })).toBeHidden();
  });

  test("picks the next colour once one is finished", async ({ page, isMobile }) => {
    await start(page, PICTURES[0].title, "Easy");
    const s = await state(page);
    const all = await areas(page);
    const mine = all.filter((a) => a.colour === s.selected);
    const total = (await page.evaluate(() => (window as unknown as { __colorTap: { puzzle(): { regions: { colour: number }[] } } }).__colorTap.puzzle().regions)).filter((r) => r.colour === s.selected).length;
    test.skip(mine.length !== total, "some of the first colour's areas are under the tools at this size");
    for (const a of mine) {
      await tap(page, a.x, a.y, isMobile);
      await page.waitForTimeout(60);
    }
    await expect(page.getByRole("radio", { name: new RegExp(`^Colour ${s.selected + 1}, finished`) })).toBeAttached();
    await expect.poll(async () => (await state(page)).selected, { timeout: 3000 }).not.toBe(s.selected);
  });

  test("the magnifier flies to an area of the colour that can't be seen, and uses one", async ({ page }) => {
    await start(page, PICTURES[0].title, "Hard");
    // Zoomed right in, most areas are off screen.
    await page.getByRole("slider", { name: "Zoom" }).fill("1000");
    await page.waitForTimeout(200);
    const before = await state(page);
    const camera = await page.evaluate(() => (window as unknown as { __colorTap: { camera(): unknown } }).__colorTap.camera());
    const glass = page.getByRole("button", { name: /^Magnifier, \d+ left/ });
    await expect(glass).toHaveAccessibleName(`Magnifier, ${before.magnifiers} left`);
    await glass.click();
    await expect(glass).toHaveAccessibleName(`Magnifier, ${before.magnifiers - 1} left`);
    await page.waitForTimeout(1400);
    const after = await page.evaluate(() => (window as unknown as { __colorTap: { camera(): unknown } }).__colorTap.camera());
    expect(after).not.toEqual(camera);
    await expect(page.getByRole("status").filter({ hasText: /Here's one/ })).toBeAttached();
  });

  test("auto-paint finishes the picture area by area, and the painting looks like the photo", async ({ page }) => {
    test.setTimeout(90_000);
    await start(page, PICTURES[0].title, "Easy");
    await page.getByRole("button", { name: /^Auto/ }).click();
    await expect(page.getByRole("button", { name: "Stop auto-paint" })).toBeVisible();
    await page.waitForTimeout(1500);
    const midway = await state(page);
    expect(midway.order.length).toBeGreaterThan(0);
    expect(midway.done).toBe(false);

    const finished = page.getByRole("dialog", { name: "Finished" });
    await expect(finished).toBeVisible({ timeout: 60_000 });
    const s = await state(page);
    expect(s.done).toBe(true);
    expect(s.auto).toBe(s.order.length);

    // The kit's test: the after is close to the photo, much closer than the blank sheet before it.
    await expect(finished.getByRole("img", { name: /^Your painting of/ })).toBeVisible();
    const after = await difference(page, "canvas:dialog[open] canvas.ctp-snap", PICTURES[0].src);
    await finished.getByRole("tab", { name: "Before" }).click();
    await expect(finished.getByRole("img", { name: /^The blank sheet of/ })).toBeVisible();
    const before = await difference(page, "canvas:dialog[open] canvas.ctp-snap", PICTURES[0].src);
    expect(after).toBeLessThan(40);
    expect(after * 2).toBeLessThan(before);
    await finished.getByRole("tab", { name: "Photo" }).click();
    await expect(finished.getByRole("img", { name: /^The photo/ })).toBeVisible();
  });

  test("tapping the picture stops auto-paint", async ({ page, isMobile }) => {
    await start(page, PICTURES[0].title, "Medium");
    await page.getByRole("button", { name: /^Auto/ }).click();
    await page.waitForTimeout(900);
    const box = (await page.locator("canvas.ctp-canvas").boundingBox())!;
    await tap(page, box.x + box.width / 2, box.y + 20, isMobile);
    await expect(page.getByRole("button", { name: "Stop auto-paint" })).toBeHidden();
    const n = (await state(page)).order.length;
    await page.waitForTimeout(500);
    expect((await state(page)).order.length).toBe(n);
  });

  test("plays by keyboard: N finds the colour's next area, Enter paints it", async ({ page, isMobile }) => {
    test.skip(isMobile, "keyboard play is for desktops");
    await start(page, PICTURES[0].title, "Easy");
    const s = await state(page);
    await page.locator("canvas.ctp-canvas").focus();
    await page.keyboard.press("n");
    await expect(page.getByRole("status").filter({ hasText: /Press Enter to paint it/ })).toBeAttached();
    await page.keyboard.press("Enter");
    await expect.poll(async () => (await state(page)).order.length).toBe(1);
    // The palette by arrow keys.
    await page.getByRole("radio", { name: new RegExp(`^Colour ${s.selected + 1},`) }).focus();
    await page.keyboard.press("ArrowRight");
    await expect.poll(async () => (await state(page)).selected).toBe(s.selected + 1);
    // Zoom keys.
    const scale = await page.evaluate(() => (window as unknown as { __colorTap: { camera(): { scale: number } } }).__colorTap.camera().scale);
    await page.locator("canvas.ctp-canvas").focus();
    await page.keyboard.press("+");
    await page.waitForTimeout(400);
    expect(await page.evaluate(() => (window as unknown as { __colorTap: { camera(): { scale: number } } }).__colorTap.camera().scale)).toBeGreaterThan(scale);
  });

  test("keeps each painting: the picker shows one started, and Continue goes back to it", async ({ page, isMobile }) => {
    await start(page, PICTURES[0].title, "Easy");
    const s = await state(page);
    const mine = (await areas(page)).find((a) => a.colour === s.selected)!;
    await tap(page, mine.x, mine.y, isMobile);
    await expect.poll(async () => (await state(page)).order.length).toBe(1);
    await page.getByRole("button", { name: "Paintings" }).click();
    const sheet = page.getByRole("dialog", { name: "New painting" });
    await expect(sheet.getByRole("radio", { name: /^Easy,.*started/ })).toBeVisible();
    await expect(sheet.getByRole("button", { name: /^Continue · \d+%/ })).toBeVisible();
    // Another level is a fresh sheet; going back to Easy continues.
    await sheet.getByRole("radio", { name: /^Medium,/ }).click();
    await expect(sheet.getByRole("button", { name: "Start painting" })).toBeVisible();
    await sheet.getByRole("radio", { name: /^Easy,/ }).click();
    await sheet.getByRole("button", { name: /^Continue/ }).click();
    await expect(sheet).toBeHidden();
    expect((await state(page)).order).toEqual([mine.area]);
  });

  test("two tabs share the painting: the one last used owns it", async ({ page, context, isMobile }) => {
    await start(page, PICTURES[0].title, "Easy");
    const s = await state(page);
    const mine = (await areas(page)).filter((a) => a.colour === s.selected).slice(0, 2);
    await tap(page, mine[0].x, mine[0].y, isMobile);
    await page.waitForTimeout(500);
    const other = await context.newPage();
    await other.goto("/games/paint-by-numbers");
    await other.waitForFunction(() => !!(window as unknown as { __colorTap?: { state(): unknown } }).__colorTap?.state());
    expect((await state(other)).order).toEqual([mine[0].area]);
    // Back in the first tab, a tap takes the painting back and paints on.
    await page.bringToFront();
    await tap(page, mine[1].x, mine[1].y, isMobile);
    await expect.poll(async () => (await state(page)).order.length).toBe(2);
  });

  test("works with reduced motion: paint lands at once", async ({ page, isMobile }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await start(page, PICTURES[0].title, "Easy");
    const s = await state(page);
    const mine = (await areas(page)).find((a) => a.colour === s.selected)!;
    await tap(page, mine.x, mine.y, isMobile);
    await expect.poll(async () => (await state(page)).order).toEqual([mine.area]);
  });

  test("asks before clearing a painting, every time Settings opens", async ({ page, isMobile }) => {
    await start(page, PICTURES[0].title, "Easy");
    const s = await state(page);
    const mine = (await areas(page)).find((a) => a.colour === s.selected)!;
    await tap(page, mine.x, mine.y, isMobile);
    await expect.poll(async () => (await state(page)).order.length).toBe(1);
    const settings = page.getByRole("dialog", { name: "Settings" });
    await page.getByRole("button", { name: "Settings" }).click();
    await settings.getByRole("button", { name: "Start this painting again" }).click();
    await expect(settings.getByRole("button", { name: "Yes, clear this painting" })).toBeVisible();
    await settings.getByRole("button", { name: "Close" }).click();
    // Opened again, it asks again: one tap never clears a painting.
    await page.getByRole("button", { name: "Settings" }).click();
    await expect(settings.getByRole("button", { name: "Start this painting again" })).toBeVisible();
    await settings.getByRole("button", { name: "Start this painting again" }).click();
    await settings.getByRole("button", { name: "Yes, clear this painting" }).click();
    await expect(settings).toBeHidden();
    await expect.poll(async () => (await state(page)).order.length).toBe(0);
  });

  test("auto-paint never paints behind a sheet", async ({ page }) => {
    await start(page, PICTURES[0].title, "Medium");
    await page.getByRole("button", { name: /^Auto/ }).click();
    await page.waitForTimeout(800);
    await page.getByRole("button", { name: "Settings" }).click();
    await expect(page.getByRole("dialog", { name: "Settings" })).toBeVisible();
    const n = (await state(page)).order.length;
    await page.waitForTimeout(800);
    expect((await state(page)).order.length).toBe(n);
  });

  test("finishes one painting, then another with fewer areas, without a hitch", async ({ page }) => {
    test.setTimeout(120_000);
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const [big, small] = [...PICTURES].sort((a, b) => b.levels[0].areas - a.levels[0].areas);
    await start(page, big.title, "Easy");
    await page.getByRole("button", { name: /^Auto/ }).click();
    const finished = page.getByRole("dialog", { name: "Finished" });
    await expect(finished).toBeVisible({ timeout: 60_000 });
    await finished.getByRole("button", { name: "New painting" }).click();
    const sheet = page.getByRole("dialog", { name: "New painting" });
    await sheet.getByRole("radio", { name: new RegExp(`^${small.title}`) }).click();
    await sheet.getByRole("radio", { name: /^Easy,/ }).click();
    await sheet.getByRole("button", { name: "Start painting" }).click();
    await expect(sheet).toBeHidden();
    await page.getByRole("button", { name: /^Auto/ }).click();
    await expect(finished).toBeVisible({ timeout: 60_000 });
    await expect(finished.getByRole("img", { name: new RegExp(`^Your painting of ${small.title}`) })).toBeVisible();
    expect(errors).toEqual([]);
  });
});
