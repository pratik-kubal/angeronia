import { test, expect, type Page } from "@playwright/test";
import { TROPHIES } from "../data/sudoku-trophies";
import { newGame, type GameState } from "../lib/sudoku/game";
import { THEMES, THEME_LIST, type SecretDef, type ThemeId } from "../lib/sudoku/themes";
import { keypad } from "../lib/sudoku/themes/keypad";

// Sudoku (/sudoku). Runs on desktop Chromium and on an iPhone in WebKit (the `iphone` project in
// playwright.config.ts). The game lives in localStorage ("sudoku:game"), so the specs read the
// solution from there and play it.

/** The game as saved after the last move. */
const saved = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem("sudoku:game")!) as GameState);
const empties = (s: GameState) => s.grid.flatMap((d, i) => (d ? [] : [i]));
const cell = (page: Page, i: number) =>
  page.getByRole("button", { name: new RegExp(`^Row ${Math.floor(i / 9) + 1}, column ${(i % 9) + 1},`) });
const key = (page: Page, d: number) => page.getByRole("button", { name: new RegExp(`^${d}, \\d left$`) });
const time = (ms: number) => {
  const s = Math.floor(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};

async function place(page: Page, i: number, digit: number) {
  await cell(page, i).click();
  await key(page, digit).click();
}

/** Opens /sudoku fresh and starts a game of the difficulty. */
async function deal(page: Page, difficulty: "Easy" | "Medium" | "Hard") {
  await page.goto("/sudoku");
  await page.getByRole("button", { name: new RegExp(`^${difficulty}`) }).click();
  await expect(page.getByRole("dialog", { name: "New game" })).toBeHidden();
  return saved(page);
}

test.beforeEach(async ({ page }) => {
  // The dev server's Next.js badge sits over the pad's first key on a phone.
  await page.addInitScript(() => {
    document.addEventListener("DOMContentLoaded", () => {
      const style = document.createElement("style");
      style.textContent = "nextjs-portal { display: none !important; }";
      document.head.appendChild(style);
    });
  });
});

test.describe("Sudoku", () => {
  test("a first visit picks a difficulty, and the board fits one screen", async ({ page }) => {
    await page.goto("/sudoku");
    const menu = page.getByRole("dialog", { name: "New game" });
    await expect(menu.getByRole("heading", { name: "New game" })).toBeVisible();
    // No game yet, so the New game sheet can't be closed.
    await expect(menu.getByRole("button", { name: "Close" })).toHaveCount(0);
    await menu.getByRole("button", { name: /^Medium/ }).click();
    const game = await saved(page);
    expect(game.difficulty).toBe("medium");
    expect(game.puzzle.filter(Boolean).length).toBeGreaterThanOrEqual(30);
    // One screen: no page scroll, and the pad's last key is on it.
    const fits = await page.evaluate(() => document.scrollingElement!.scrollHeight <= window.innerHeight);
    expect(fits).toBe(true);
    await expect(key(page, 9)).toBeInViewport({ ratio: 1 });
    await expect(page.locator("meta[name='robots']")).toHaveAttribute("content", /noindex/);
  });

  test("a new game deals in with number reels that land on the clues", async ({ page }) => {
    await deal(page, "Easy");
    await expect(page.locator(".sdk-reel").first()).toBeAttached();
    await expect(page.locator(".sdk-reel")).toHaveCount(0, { timeout: 3000 });
    const game = await saved(page);
    const clue = game.puzzle.findIndex(Boolean);
    await expect(cell(page, clue)).toHaveAccessibleName(new RegExp(`, ${game.puzzle[clue]}, clue$`));
  });

  test("the tap that starts a first game, waking the sound, sounds the deal", async ({ page }) => {
    // WebKit starts the sound suspended in that tap and running a moment later: the deal's notes
    // wait for it instead of being lost. Every note started is counted, with the state it started in.
    await page.addInitScript(() => {
      const notes: string[] = [];
      (window as unknown as { __notes: string[] }).__notes = notes;
      const start = OscillatorNode.prototype.start;
      OscillatorNode.prototype.start = function (this: OscillatorNode, ...args: Parameters<OscillatorNode["start"]>) {
        notes.push(this.context.state);
        return start.apply(this, args);
      };
    });
    await deal(page, "Easy");
    const notes = () => page.evaluate(() => (window as unknown as { __notes: string[] }).__notes);
    // Aurora's deal is a run of nine ticks.
    await expect.poll(async () => (await notes()).length).toBeGreaterThanOrEqual(9);
    expect(new Set(await notes())).toEqual(new Set(["running"]));
  });

  test("a correct digit locks; a wrong one is refused and counts for nothing", async ({ page }) => {
    const game = await deal(page, "Easy");
    const [a, b] = empties(game);
    await place(page, a, game.solution[a]);
    await expect(cell(page, a)).toHaveAccessibleName(new RegExp(`, ${game.solution[a]}$`));

    const wrong = (game.solution[b] % 9) + 1;
    for (let k = 0; k < 4; k++) await place(page, b, wrong);
    await expect(cell(page, b)).toHaveAccessibleName(/, empty$/);
    const after = await saved(page);
    expect(after.grid[b]).toBe(0);
    expect(after.status).toBe("playing");
    await expect(page.getByText(/Mistakes/)).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Erase" })).toHaveCount(0);
  });

  test("notes pencil marks, and tapping a mark again takes it off", async ({ page }) => {
    const game = await deal(page, "Easy");
    const [a] = empties(game);
    await page.getByRole("button", { name: "Notes", exact: true }).click();
    await place(page, a, 1);
    await key(page, 5).click();
    await expect(cell(page, a)).toHaveAccessibleName(/notes 1 5$/);
    await key(page, 1).click();
    await expect(cell(page, a)).toHaveAccessibleName(/notes 5$/);
  });

  test("a reload resumes the game", async ({ page }) => {
    const game = await deal(page, "Easy");
    const [a] = empties(game);
    await place(page, a, game.solution[a]);
    await page.reload();
    await expect(page.getByRole("dialog", { name: "New game" })).toBeHidden();
    await expect(cell(page, a)).toHaveAccessibleName(new RegExp(`, ${game.solution[a]}$`));
  });

  test("solving the board plays the finale, wins a trophy for the collection and sets the best time", async ({ page }) => {
    const game = await deal(page, "Easy");
    for (const i of empties(game)) await place(page, i, game.solution[i]);
    await expect(page.locator(".sdk-fireworks")).toBeAttached({ timeout: 5000 });
    const result = page.getByRole("dialog", { name: "Result" });
    await expect(result.getByRole("heading", { name: "Solved" })).toBeVisible({ timeout: 15_000 });
    const won = await saved(page);
    const trophy = TROPHIES.find((t) => t.id === won.trophy)!;
    expect(trophy).toBeDefined();
    await expect(result.getByText(trophy.name, { exact: true })).toBeVisible();
    await expect(result.getByText("New find")).toBeVisible();
    await expect(result.getByText("New best")).toBeVisible();
    await expect(result.locator(".sdk-final")).toHaveText(time(won.elapsed));
    // The trophy is in the collection, and a reload never draws another.
    await result.getByRole("button", { name: "Collection" }).click();
    const shelf = page.getByRole("dialog", { name: "Collection" });
    await expect(shelf.getByText(/^1 of 100 found$/)).toBeVisible();
    await expect(shelf.getByRole("button", { name: trophy.name })).toBeVisible();
    await page.reload();
    await expect(page.getByRole("button", { name: "Collection, 1 of 100 found" })).toBeVisible();
    expect((await saved(page)).trophy).toBe(won.trophy);
    // A reloaded solved board shows its result again; from there, the New game sheet shows the best time.
    await page.getByRole("dialog", { name: "Result" }).getByRole("button", { name: "Change difficulty" }).click();
    await expect(page.getByRole("dialog", { name: "New game" }).getByText(`Best ${time(won.elapsed)}`)).toBeVisible();
  });

  test("the title counts the player's boards: Puzzle 1 until the first is won, then Puzzle 2", async ({ page }) => {
    const title = page.locator(".sdk-title");
    const game = await deal(page, "Easy");
    await expect(title).toHaveText(/Easy Puzzle 1$/);
    for (const i of empties(game)) await place(page, i, game.solution[i]);
    const result = page.getByRole("dialog", { name: "Result" });
    await expect(result.getByRole("heading", { name: "Solved" })).toBeVisible({ timeout: 15_000 });
    // The won board has drawn its trophy and is still the first.
    expect((await saved(page)).trophy).not.toBeNull();
    await expect(title).toHaveText(/Easy Puzzle 1$/);
    await result.getByRole("button", { name: "New game" }).click();
    await expect(result).toBeHidden();
    await expect(title).toHaveText(/Easy Puzzle 2$/);
  });

  test("a hint fills a cell and spends one", async ({ page }) => {
    const game = await deal(page, "Easy");
    const [a] = empties(game);
    await cell(page, a).click();
    await page.getByRole("button", { name: "Hint, 3 left" }).click();
    await expect(cell(page, a)).toHaveAccessibleName(new RegExp(`, ${game.solution[a]}$`));
    await expect(page.getByRole("button", { name: "Hint, 2 left" })).toBeVisible();
  });

  test("the pad stacks what is left of each digit in its own colour, in two staggered rows", async ({ page }) => {
    const game = await deal(page, "Easy");
    const bars = (d: number) => page.locator(`.sdk-key[data-digit="${d}"] .sdk-stack i`);
    for (let d = 1; d <= 9; d++) await expect(bars(d)).toHaveCount(9 - game.grid.filter((v) => v === d).length);
    const a = empties(game)[0];
    const d = game.solution[a];
    const before = await bars(d).count();
    await place(page, a, d);
    await expect(bars(d)).toHaveCount(before - 1);
    // Nine digits, nine colours.
    const colours = await page.locator(".sdk-key[data-digit] .sdk-key-n").evaluateAll((els) => els.map((el) => getComputedStyle(el).color));
    expect(new Set(colours).size).toBe(9);
    // 1–5 across the top; Notes then 6–9 below, each of 6–9 between the two keys above it.
    const box = async (name: string | RegExp) => (await page.getByRole("button", { name }).boundingBox())!;
    const top = await Promise.all([1, 2, 3, 4, 5].map((k) => box(new RegExp(`^${k}, \\d left$`))));
    const bottom = await Promise.all([6, 7, 8, 9].map((k) => box(new RegExp(`^${k}, \\d left$`))));
    const notes = await box("Notes");
    const mid = (b: { x: number; width: number }) => b.x + b.width / 2;
    for (const b of [notes, ...bottom]) expect(b.y).toBeGreaterThan(top[0].y + top[0].height / 2);
    expect(mid(notes)).toBeLessThan(mid(top[0]));
    bottom.forEach((b, k) => {
      expect(mid(b)).toBeGreaterThan(mid(top[k]));
      expect(mid(b)).toBeLessThan(mid(top[k + 1]));
    });
  });

  test("the scheme follows the system, and a chosen appearance sticks before the first paint", async ({ page }) => {
    await deal(page, "Easy");
    const root = page.locator("html");
    await expect(root).toHaveAttribute("data-sdk-scheme", "light");
    const light = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    await page.getByRole("button", { name: "Settings" }).click();
    await page.getByRole("dialog", { name: "Settings" }).getByRole("radio", { name: "Dark" }).check();
    await expect(root).toHaveAttribute("data-sdk-scheme", "dark");
    const dark = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(dark).not.toBe(light);
    // On a reload the inline script sets the scheme before React runs.
    await page.reload({ waitUntil: "commit" });
    await page.waitForSelector(".sdk-shell");
    expect(await page.evaluate(() => document.documentElement.dataset.sdkScheme)).toBe("dark");
    expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe(dark);
  });

  test("Aurora is the default; a theme picked in Settings shows at once, and sticks before the first paint", async ({ page }) => {
    // October: the default stays Aurora even in a theme's season.
    await page.clock.setFixedTime(new Date(2026, 9, 22, 12));
    await deal(page, "Easy");
    const root = page.locator("html");
    await expect(root).toHaveAttribute("data-sdk-theme", "aurora");
    await page.waitForTimeout(2500);
    await expect(page.locator(".sdk-toast")).toHaveCount(0);
    const ground = () => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--bg").trim());
    const aurora = await ground();
    await page.getByRole("button", { name: "Settings" }).click();
    await page.getByRole("dialog", { name: "Settings" }).getByRole("button", { name: /^Theme/ }).click();
    const picker = page.getByRole("dialog", { name: "Themes" });
    await picker.getByRole("radio", { name: "Halloween" }).check();
    await expect(root).toHaveAttribute("data-sdk-theme", "halloween");
    const halloween = await ground();
    expect(halloween).not.toBe(aurora);
    // Closing the picker goes back to Settings, which names the theme.
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "Settings" }).getByRole("button", { name: /^Theme/ })).toContainText("Halloween");
    await page.reload({ waitUntil: "commit" });
    await page.waitForSelector(".sdk-shell");
    expect(await page.evaluate(() => document.documentElement.dataset.sdkTheme)).toBe("halloween");
    expect(await ground()).toBe(halloween);
  });

  test("the dock's Themes opens the picker on its own", async ({ page, isMobile }) => {
    await deal(page, "Easy");
    const dock = page.getByRole("navigation", { name: "Game" }).getByRole("button", { name: "Themes" });
    await dock.click();
    const picker = page.getByRole("dialog", { name: "Themes" });
    const settings = page.getByRole("dialog", { name: "Settings" });
    await expect(picker).toBeVisible();
    await expect(settings).toBeHidden();
    await picker.getByRole("radio", { name: "Candy" }).check();
    await expect(page.locator("html")).toHaveAttribute("data-sdk-theme", "candy");
    // Closing it goes back to the game, never by way of Settings.
    await page.keyboard.press("Escape");
    await expect(picker).toBeHidden();
    await expect(settings).toBeHidden();
    // A tap doesn't focus a button in Safari, so only a desktop has focus to give back.
    if (!isMobile) await expect(dock).toBeFocused();
  });

  test("the dock's Play opens the New game sheet, which closes while a game is under way", async ({ page }) => {
    const game = await deal(page, "Easy");
    await page.getByRole("navigation", { name: "Game" }).getByRole("button", { name: "Play" }).click();
    const sheet = page.getByRole("dialog", { name: "New game" });
    await expect(sheet.getByRole("heading", { name: "New game" })).toBeVisible();
    await expect(sheet.getByText("Current", { exact: true })).toBeVisible();
    // Settings is the gear's once there is a game.
    await expect(sheet.getByRole("button", { name: "Settings" })).toHaveCount(0);
    await sheet.getByRole("button", { name: "Close" }).click();
    await expect(sheet).toBeHidden();
    expect((await saved(page)).seed).toBe(game.seed);
  });

  test("Seasonal follows the calendar, and a season's arrival is told once", async ({ page }) => {
    await page.clock.setFixedTime(new Date(2026, 9, 22, 12));
    await page.addInitScript(() => localStorage.setItem("sudoku:settings", JSON.stringify({ theme: "seasonal" })));
    await deal(page, "Easy");
    await expect(page.locator("html")).toHaveAttribute("data-sdk-theme", "halloween");
    await expect(page.locator(".sdk-toast")).toContainText("Now in season");
    await page.reload();
    await expect(page.getByRole("dialog", { name: "New game" })).toBeHidden();
    // The toast waits for the surprise's best part (1.4 s): long enough to know none is coming.
    await page.waitForTimeout(2500);
    await expect(page.locator(".sdk-toast")).toHaveCount(0);
    await page.clock.setFixedTime(new Date(2026, 6, 4, 12));
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-sdk-theme", "beach");
    await expect(page.locator(".sdk-toast")).toContainText("Now in season");
    // Between seasons Aurora comes back, and says so.
    await page.clock.setFixedTime(new Date(2026, 8, 10, 12));
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-sdk-theme", "aurora");
    await expect(page.locator(".sdk-toast")).toContainText("Between seasons");
  });

  test("a phone on its side keeps the board and the pad on screen", async ({ page }) => {
    await deal(page, "Easy");
    for (const size of [
      { width: 852, height: 393 },
      { width: 568, height: 320 },
    ]) {
      await page.setViewportSize(size);
      await expect(key(page, 9)).toBeInViewport({ ratio: 1 });
      await expect(key(page, 1)).toBeInViewport({ ratio: 1 });
      await expect(page.locator(".sdk-board")).toBeInViewport({ ratio: 1 });
    }
    // The controls take only what full-size keys need, so a small phone's board keeps 23px cells.
    expect((await page.locator(".sdk-board").boundingBox())!.width).toBeGreaterThanOrEqual(207);
  });

  test("the first-visit New game sheet survives repeated Escapes", async ({ page, isMobile }) => {
    test.skip(isMobile, "Escape is a keyboard key");
    await page.goto("/sudoku");
    const menu = page.getByRole("dialog", { name: "New game" });
    await expect(menu).toBeVisible();
    for (let k = 0; k < 3; k++) await page.keyboard.press("Escape");
    await expect(menu).toBeVisible();
    await menu.getByRole("button", { name: /^Easy/ }).click();
    await expect(menu).toBeHidden();
  });

  test("a first visit reaches Settings from the New game sheet, which comes back after", async ({ page, isMobile }) => {
    await page.goto("/sudoku");
    const menu = page.getByRole("dialog", { name: "New game" });
    const row = menu.getByRole("button", { name: "Settings" });
    await row.click();
    const settings = page.getByRole("dialog", { name: "Settings" });
    await expect(settings).toBeVisible();
    await expect(menu).toBeHidden();
    // A page can't read Silent Mode, which mutes the game on an iPhone or iPad: Settings says so.
    await expect(settings.getByText("On an iPhone or iPad, Silent Mode mutes the game's sounds.")).toBeVisible();
    // Quiet before the first deal makes a sound.
    await settings.getByRole("switch", { name: "Sound" }).uncheck();
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("sudoku:settings")!).sound)).toBe(false);
    await settings.getByRole("button", { name: "Close" }).click();
    await expect(settings).toBeHidden();
    // Still no game: the sheet is back, and still can't be closed.
    await expect(menu).toBeVisible();
    await expect(menu.getByRole("button", { name: "Close" })).toHaveCount(0);
    if (!isMobile) await expect(row).toBeFocused();
    await menu.getByRole("button", { name: /^Easy/ }).click();
    await expect(menu).toBeHidden();
    expect((await saved(page)).difficulty).toBe("easy");
  });

  test("native controls follow the Sudoku theme, not the site's", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("theme", "light"));
    await deal(page, "Easy");
    await page.getByRole("button", { name: "Settings" }).click();
    await page.getByRole("dialog", { name: "Settings" }).getByRole("radio", { name: "Dark" }).check();
    await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).colorScheme)).toBe("dark");
  });

  test("a held key counts once", async ({ page, isMobile }) => {
    test.skip(isMobile, "keyboard play is for desktops");
    await deal(page, "Easy");
    await page.keyboard.down("h");
    await page.keyboard.down("h"); // repeats while held
    await page.keyboard.down("h");
    await page.keyboard.up("h");
    await expect(page.getByRole("button", { name: "Hint, 2 left" })).toBeVisible();
  });

  test("a second tab's newer game wins over a stale tab", async ({ page, context }) => {
    const game = await deal(page, "Easy");
    const [a] = empties(game);
    const other = await context.newPage();
    await other.goto("/sudoku");
    await expect(other.getByRole("dialog", { name: "New game" })).toBeHidden();
    await place(other, a, game.solution[a]);
    // The first tab takes the move from the storage event, and doesn't save over it.
    await expect(cell(page, a)).toHaveAccessibleName(new RegExp(`, ${game.solution[a]}$`));
    await page.waitForTimeout(1200);
    expect((await saved(other)).grid[a]).toBe(game.solution[a]);
  });

  test("one win draws one trophy, even with a second tab open", async ({ page, context }) => {
    const game = await deal(page, "Easy");
    const other = await context.newPage();
    await other.goto("/sudoku");
    await expect(other.getByRole("dialog", { name: "New game" })).toBeHidden();
    for (const i of empties(game)) await place(page, i, game.solution[i]);
    await expect(page.getByRole("dialog", { name: "Result" }).getByRole("heading", { name: "Solved" })).toBeVisible({ timeout: 15_000 });
    const won = await saved(page);
    const trophy = TROPHIES.find((t) => t.id === won.trophy)!;
    // The other tab shows the same trophy, and the collection holds exactly one.
    await expect(other.getByRole("dialog", { name: "Result" }).getByText(trophy.name, { exact: true })).toBeVisible({ timeout: 15_000 });
    const collection = await page.evaluate(() => JSON.parse(localStorage.getItem("sudoku:collection")!) as Record<string, number>);
    expect(collection).toEqual({ [trophy.id]: 1 });
  });

  test("focus comes back through stacked sheets", async ({ page, isMobile }) => {
    test.skip(isMobile, "keyboard focus is for desktops");
    await deal(page, "Easy");
    const gear = page.getByRole("button", { name: "Settings" });
    await gear.focus();
    await page.keyboard.press("Enter");
    const row = page.getByRole("dialog", { name: "Settings" }).getByRole("button", { name: /^Theme/ });
    await row.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("dialog", { name: "Themes" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(row).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(gear).toBeFocused();
  });

  test("the keyboard plays on a desktop", async ({ page, isMobile }) => {
    test.skip(isMobile, "keyboard play is for desktops");
    const game = await deal(page, "Easy");
    const a = empties(game)[0];
    await cell(page, a).click();
    await page.keyboard.press(String(game.solution[a]));
    await expect(cell(page, a)).toHaveAccessibleName(new RegExp(`, ${game.solution[a]}$`));
    await page.keyboard.press("ArrowRight");
    await expect(page.locator(".sdk-cell[data-selected]")).toBeFocused();
    await page.keyboard.press("n");
    await expect(page.getByRole("button", { name: "Notes", exact: true })).toHaveAttribute("aria-pressed", "true");
  });
});

/** Opens every page in the theme, with its season's arrival already told and the sound off. */
async function themed(page: Page, theme: ThemeId) {
  await page.addInitScript((theme) => {
    localStorage.setItem("sudoku:settings", JSON.stringify({ theme, sound: false }));
    localStorage.setItem("sudoku:arrived", JSON.stringify(theme));
  }, theme);
}

/** How many taps on the title in a row meet the secret (0 if none up to 12 do). */
function tapsFor(secret: SecretDef) {
  for (let taps = 1; taps <= 12; taps++) if (secret.test({ moment: { kind: "emblem", taps }, now: new Date(), recent: [] })) return taps;
  return 0;
}

/** The words spelled on the pad (a phone keypad's letters) that find a secret. */
const WORDS: { theme: ThemeId; word: string; secret: string }[] = [
  { theme: "candy", word: "candy", secret: "candy-jar" },
  { theme: "beach", word: "gull", secret: "fry-thief" },
  { theme: "snow", word: "cocoa", secret: "cocoa-break" },
  { theme: "blossom", word: "buzz", secret: "busy-bee" },
];

test.describe("Sudoku themes", () => {
  for (const theme of THEME_LIST) {
    const secret = theme.secrets.find((s) => s.on.includes("emblem"));
    if (!secret) continue;
    const taps = tapsFor(secret);
    test(`${theme.name}: ${taps} quick taps on the title find ${secret.name}, and the picker lists it`, async ({ page }) => {
      expect(taps).toBeGreaterThan(1);
      await themed(page, theme.id);
      await deal(page, "Easy");
      await expect(page.locator("html")).toHaveAttribute("data-sdk-theme", theme.id);
      const title = page.locator(".sdk-title");
      for (let k = 0; k < taps; k++) await title.click();
      await expect(page.locator(".sdk-toast")).toContainText(secret.name);
      expect(await page.evaluate(() => JSON.parse(localStorage.getItem("sudoku:secrets")!))).toEqual({ [theme.id]: [secret.id] });
      // The surprise plays: every overlay is empty at rest (Beach plays Seven Seas in its scene).
      await expect(page.locator(".sdk-overlay > *, .sdk-scene .sdk-beach-seas").first()).toBeAttached();
      await page.getByRole("button", { name: "Settings" }).click();
      await page.getByRole("dialog", { name: "Settings" }).getByRole("button", { name: /^Theme/ }).click();
      const picker = page.getByRole("dialog", { name: "Themes" });
      await expect(picker.getByText(secret.found)).toBeVisible();
      for (const hidden of theme.secrets.filter((s) => s !== secret)) await expect(picker.getByText(hidden.riddle)).toBeVisible();
      await expect(picker.getByText(`1/${theme.secrets.length} secrets`)).toBeVisible();
    });
  }

  for (const { theme, word, secret: id } of WORDS) {
    const secret = THEMES[theme].secrets.find((s) => s.id === id)!;
    test(`${THEMES[theme].name}: "${word}" spelled on the pad (${keypad(word).join("-")}) finds ${secret.name}`, async ({ page }) => {
      const game = newGame("easy", 777);
      await themed(page, theme);
      await page.addInitScript((game) => localStorage.setItem("sudoku:game", JSON.stringify(game)), game);
      await page.goto("/sudoku");
      await expect(page.getByRole("dialog", { name: "New game" })).toBeHidden();
      const used = new Set<number>();
      for (const digit of keypad(word)) {
        const i = game.grid.findIndex((d, k) => !d && !used.has(k) && game.solution[k] === digit);
        expect(i).toBeGreaterThanOrEqual(0);
        used.add(i);
        await place(page, i, digit);
      }
      await expect(page.locator(".sdk-toast")).toContainText(secret.name);
    });
  }

  test("Halloween O'Clock: a 3 placed at 10:31 at night, and the result lists the secret", async ({ page }) => {
    await page.clock.setFixedTime(new Date(2026, 9, 22, 22, 31, 10));
    await themed(page, "halloween");
    const game = await deal(page, "Easy");
    const first = empties(game).find((i) => game.solution[i] === 3)!;
    const rest = empties(game).filter((i) => i !== first);
    await place(page, first, 3);
    await expect(page.locator(".sdk-toast")).toContainText("Halloween O'Clock");
    for (const i of rest) await place(page, i, game.solution[i]);
    const result = page.getByRole("dialog", { name: "Result" });
    await expect(result.getByRole("heading", { name: THEMES.halloween.solved })).toBeVisible({ timeout: 15_000 });
    await expect(result.getByText("Halloween O'Clock")).toBeVisible();
  });
});
