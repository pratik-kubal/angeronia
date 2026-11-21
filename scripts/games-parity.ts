// Proves a change to the studio's global CSS did not change how the games render.
//
//   npx tsx scripts/games-parity.ts baseline     before the change
//   npx tsx scripts/games-parity.ts compare      after it
//
// Both need a PRODUCTION server on PARITY_PORT (default 3417):
//   npm run build && npx next start -p 3417
//
// It loads the launcher and each game in a fresh browser with the clock, the
// random source and motion pinned, and records the computed style of every
// element. `compare` fails if any element at or inside a game's shell differs.
import { chromium, type Page } from "playwright";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const PORT = Number(process.env.PARITY_PORT ?? 3417);
const OUT = ".parity";
const ROUTES = ["/games", "/games/sudoku", "/games/solitaire", "/games/paint-by-numbers"];
const VIEWPORTS = [
  { name: "desktop", width: 1280, height: 800 },
  { name: "phone", width: 393, height: 852 },
];
const SHELLS = ".sdk-shell, .sol-shell, .gml-shell, .ctp-shell";

type Row = { key: string; inShell: boolean; style: Record<string, string> };

/** Same puzzle, same deal, same season on every run. */
const PIN = `(() => {
  let s = 20261120;
  const next = () => (s = (s * 16807) % 2147483647) / 2147483647;
  Math.random = next;
  const fill = (arr) => { for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(next() * 256); return arr; };
  try { Object.defineProperty(globalThis.crypto, "getRandomValues", { value: fill }); } catch {}
})();`;

async function snapshot(page: Page): Promise<Row[]> {
  // tsx compiles with esbuild's keepNames, which wraps the named functions
  // below in a `__name()` helper that exists only in Node. Give the page a
  // no-op one (a string, so esbuild leaves it alone). It renders nothing.
  await page.evaluate("globalThis.__name = (fn) => fn;");
  return page.evaluate((shells) => {
    const skip = new Set(["SCRIPT", "STYLE", "LINK", "META", "TITLE", "HEAD", "NEXTJS-PORTAL", "NEXT-ROUTE-ANNOUNCER"]);
    const shellList = shells.split(",").map((selector) => selector.trim());
    const path = (el: Element) => {
      const parts: string[] = [];
      let node: Element | null = el;
      while (node && node !== document.documentElement) {
        const parent: Element | null = node.parentElement;
        // Inside a game, key from its outermost shell, so a change before the shell (a
        // script the layout adds or drops in <body>) cannot renumber every game element.
        const shell = shellList.find((selector) => node!.matches(selector));
        if (shell && !parent?.closest(shells)) {
          parts.unshift(shell);
          return parts.join("/");
        }
        const index = parent ? Array.from(parent.children).indexOf(node) : 0;
        parts.unshift(`${node.tagName.toLowerCase()}[${index}]`);
        node = parent;
      }
      return "html/" + parts.join("/");
    };
    const rows: { key: string; inShell: boolean; style: Record<string, string> }[] = [];
    const all = [document.documentElement, ...Array.from(document.querySelectorAll("body, body *"))];
    for (const el of all) {
      if (skip.has(el.tagName)) continue;
      const computed = getComputedStyle(el);
      const style: Record<string, string> = {};
      for (let i = 0; i < computed.length; i++) {
        const prop = computed[i];
        if (prop.startsWith("--")) continue; // custom properties are not rendering
        style[prop] = computed.getPropertyValue(prop);
      }
      rows.push({ key: path(el), inShell: el.closest(shells) !== null, style });
    }
    return rows;
  }, SHELLS);
}

async function capture(): Promise<Record<string, Row[]>> {
  const browser = await chromium.launch();
  const result: Record<string, Row[]> = {};
  for (const viewport of VIEWPORTS) {
    for (const route of ROUTES) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        reducedMotion: "reduce",
        colorScheme: "light",
      });
      const page = await context.newPage();
      await page.addInitScript(PIN);
      await page.clock.setFixedTime(new Date("2026-06-15T12:00:00"));
      await page.goto(`http://localhost:${PORT}${route}`, { waitUntil: "networkidle" });
      await page.waitForTimeout(1500);
      result[`${viewport.name} ${route}`] = await snapshot(page);
      await context.close();
    }
  }
  await browser.close();
  return result;
}

async function main() {
  const mode = process.argv[2];
  if (mode !== "baseline" && mode !== "compare") {
    console.error("usage: tsx scripts/games-parity.ts baseline|compare");
    process.exit(2);
  }
  mkdirSync(OUT, { recursive: true });
  const file = `${OUT}/baseline.json`;
  const now = await capture();

  if (mode === "baseline") {
    writeFileSync(file, JSON.stringify(now));
    const count = Object.values(now).reduce((n, rows) => n + rows.length, 0);
    console.log(`baseline written: ${Object.keys(now).length} screens, ${count} elements`);
    return;
  }

  if (!existsSync(file)) {
    console.error("no baseline. Run `baseline` on the tree before the change.");
    process.exit(2);
  }
  const before: Record<string, Row[]> = JSON.parse(readFileSync(file, "utf8"));
  let failures = 0;
  for (const [screen, rows] of Object.entries(now)) {
    const old = new Map((before[screen] ?? []).map((row) => [row.key, row]));
    const outside = new Set<string>();
    for (const row of rows) {
      const was = old.get(row.key);
      if (!was) {
        if (row.inShell) { failures++; console.log(`FAIL ${screen}: new element in a shell: ${row.key}`); }
        continue;
      }
      for (const [prop, value] of Object.entries(row.style)) {
        if (was.style[prop] === value) continue;
        if (row.inShell) {
          failures++;
          console.log(`FAIL ${screen}: ${row.key} { ${prop}: ${was.style[prop]} -> ${value} }`);
        } else {
          outside.add(`${row.key.split("/").slice(0, 4).join("/")} ${prop}`);
        }
      }
    }
    for (const key of old.keys()) {
      if (!rows.some((row) => row.key === key) && old.get(key)!.inShell) {
        failures++;
        console.log(`FAIL ${screen}: element gone from a shell: ${key}`);
      }
    }
    if (outside.size) console.log(`note ${screen}: ${outside.size} differences outside the shells (expected: html, body, the skip link)`);
  }
  if (failures) {
    console.log(`\n${failures} difference(s) inside a game. The change is not safe yet.`);
    process.exit(1);
  }
  console.log("\nno difference inside any game.");
}

main();
