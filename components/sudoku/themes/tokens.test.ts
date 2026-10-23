import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { THEME_IDS } from "@/lib/sudoku/themes";

// The theme stylesheets: every theme redefines every one of Aurora's colour tokens for both
// schemes (a token it left out would show Aurora's, or its own light value in dark), keeps its
// text legible, scopes every rule to itself and moves only for players who don't mind motion.

const read = (path: string) => readFileSync(join(__dirname, "..", path), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
const BASE = read("sudoku.css");
const sheet = (id: string) => read(`themes/${id}/${id}.css`);

/** The declarations of the block whose selector is exactly `selector`. */
function block(css: string, selector: string): Map<string, string> | null {
  const at = css.indexOf(`${selector} {`);
  if (at < 0) return null;
  const open = at + selector.length + 1;
  let depth = 0;
  let end = open;
  for (; end < css.length; end++) {
    if (css[end] === "{") depth++;
    if (css[end] === "}" && --depth === 0) break;
  }
  const tokens = new Map<string, string>();
  for (const decl of css.slice(open + 1, end).split(";")) {
    const m = decl.match(/^\s*(--[\w-]+)\s*:\s*([\s\S]+?)\s*$/);
    if (m) tokens.set(m[1], m[2]);
  }
  return tokens;
}

const auroraLight = block(BASE, "html:has(.sdk-shell)")!;
const auroraDark = block(BASE, 'html[data-sdk-scheme="dark"]:has(.sdk-shell)')!;
/** Every token a theme must set, in both schemes: all of Aurora's but the font. */
const REQUIRED = [...auroraDark.keys()];

const schemes = (id: string) =>
  id === "aurora"
    ? { light: auroraLight, dark: auroraDark }
    : {
        light: block(sheet(id), `html[data-sdk-theme="${id}"]:has(.sdk-shell)`),
        dark: block(sheet(id), `html[data-sdk-theme="${id}"][data-sdk-scheme="dark"]:has(.sdk-shell)`),
      };

/** One colour for each digit, 1 to 9. */
const DIGITS = Array.from({ length: 9 }, (_, k) => `--d${k + 1}`);
/** Tokens that must be plain #rrggbb, so their contrast can be checked here. */
const SOLID = ["--bg", "--surface", "--sheet-solid", "--ink", "--muted", "--peer", "--error", "--error-bg", "--accent", "--success-ink", ...DIGITS];
/** Text on its ground, each at least WCAG AA (4.5:1); the accent (rings, switches) at least 3:1. */
const PAIRS: [string, string, number][] = [
  ["--ink", "--surface", 4.5],
  ["--error", "--error-bg", 4.5],
  ["--success-ink", "--surface", 4.5],
  ["--ink", "--sheet-solid", 4.5],
  ["--muted", "--sheet-solid", 4.5],
  ["--muted", "--surface", 4.5],
  ["--accent", "--sheet-solid", 3],
];

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const channels = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
/** `color-mix(in srgb, a p, b)`: each channel mixed as stored (gamma-encoded), as the browser does. */
const mix = (a: string, b: string, p: number) => {
  const [x, y] = [channels(a), channels(b)];
  return `#${x.map((c, k) => Math.round(c * p + y[k] * (1 - p)).toString(16).padStart(2, "0")).join("")}`;
};
/** A colour in OKLab, where distance follows how different two colours look. */
function oklab(hex: string): [number, number, number] {
  const [r, g, b] = channels(hex).map((c) => c / 255).map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  const [l, m, s] = [
    0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b,
    0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b,
    0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b,
  ].map(Math.cbrt);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}
/** How far apart two colours look: below about 0.02 most people can't tell them apart. */
const distance = (a: string, b: string) => Math.hypot(...oklab(a).map((v, k) => v - oklab(b)[k]));
/** The least distance any two of the nine digit colours may have. */
const DIGITS_APART = 0.07;

describe.each(THEME_IDS.map((id) => [id]))("%s", (id) => {
  const { light, dark } = schemes(id);

  it("sets every token, in light and in dark", () => {
    expect(light, "the light block").not.toBeNull();
    expect(dark, "the dark block").not.toBeNull();
    const missing = (tokens: Map<string, string>) => REQUIRED.filter((t) => !tokens.has(t));
    expect(missing(light!), "light").toEqual([]);
    expect(missing(dark!), "dark").toEqual([]);
    if (id !== "aurora") expect([...dark!.keys()].sort()).toEqual([...light!.keys()].sort());
  });

  it.each(["light", "dark"] as const)("keeps its text legible in %s", (scheme) => {
    const tokens = (scheme === "light" ? light : dark)!;
    for (const t of SOLID) expect(tokens.get(t), t).toMatch(/^#[0-9a-f]{6}$/i);
    for (const [fg, bg, min] of PAIRS) {
      expect(contrast(tokens.get(fg)!, tokens.get(bg)!), `${fg} on ${bg}`).toBeGreaterThanOrEqual(min);
    }
    // The selection pill's text on every colour of its gradient.
    const ink = tokens.get("--select-ink")!;
    expect(ink).toMatch(/^#[0-9a-f]{6}$/i);
    const stops = tokens.get("--select")!.match(/#[0-9a-f]{6}\b/gi) ?? [];
    expect(stops.length).toBeGreaterThan(0);
    for (const stop of stops) expect(contrast(ink, stop), `--select-ink on ${stop}`).toBeGreaterThanOrEqual(4.5);
  });

  it.each(["light", "dark"] as const)("gives every digit a colour that reads on the cells in %s", (scheme) => {
    const tokens = (scheme === "light" ? light : dark)!;
    const [surface, peer] = [tokens.get("--surface")!, tokens.get("--peer")!];
    for (const d of DIGITS) {
      const colour = tokens.get(d)!;
      expect(contrast(colour, surface), `${d} on --surface`).toBeGreaterThanOrEqual(4.5);
      expect(contrast(colour, peer), `${d} on --peer`).toBeGreaterThanOrEqual(4.5);
      // A twin of the selected digit sits on a pill of its own colour's tint (sudoku.css).
      expect(contrast(colour, mix(colour, surface, 0.12)), `${d} on its twin pill`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it.each(["light", "dark"] as const)("gives no two digits colours that look alike in %s", (scheme) => {
    const tokens = (scheme === "light" ? light : dark)!;
    for (const [i, a] of DIGITS.entries()) {
      for (const b of DIGITS.slice(i + 1)) {
        expect(distance(tokens.get(a)!, tokens.get(b)!), `${a} and ${b}`).toBeGreaterThanOrEqual(DIGITS_APART);
      }
    }
  });
});

describe("Candy's sweets", () => {
  const { light, dark } = schemes("candy");
  const TILES = Array.from({ length: 9 }, (_, k) => `--sdk-candy-t${k + 1}`);
  /** WCAG's large text, bold: 14pt, which is 18.67px. */
  const LARGE_BOLD = 18.67;

  it.each(["light", "dark"] as const)("wraps every digit so its white numeral reads, and no two alike, in %s", (scheme) => {
    const tokens = (scheme === "light" ? light : dark)!;
    const ink = tokens.get("--sdk-candy-tile-ink")!;
    expect(ink).toMatch(/^#[0-9a-f]{6}$/i);
    for (const t of TILES) {
      expect(tokens.get(t), t).toMatch(/^#[0-9a-f]{6}$/i);
      // A numeral on a tile is bold and never under 14pt, on the board and on the pad (checked below):
      // WCAG's large text, which needs 3:1.
      expect(contrast(ink, tokens.get(t)!), `the numeral on ${t}`).toBeGreaterThanOrEqual(3);
    }
    for (const [i, a] of TILES.entries()) {
      for (const b of TILES.slice(i + 1)) expect(distance(tokens.get(a)!, tokens.get(b)!), `${a} and ${b}`).toBeGreaterThanOrEqual(DIGITS_APART);
    }
  });

  it.each(["light", "dark"] as const)("keeps pencil marks legible on an empty tile in %s", (scheme) => {
    const tokens = (scheme === "light" ? light : dark)!;
    const empty = tokens.get("--sdk-candy-empty")!;
    expect(empty).toMatch(/^#[0-9a-f]{6}$/i);
    for (const d of DIGITS) expect(contrast(tokens.get(d)!, empty), `${d} on an empty tile`).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps every numeral on a tile bold and at least 14pt", () => {
    /** The declarations of `prop` in rules whose selector (the innermost, at-rules around it allowed) passes `test`. */
    const values = (css: string, prop: string, test: (selector: string) => boolean) =>
      walk(css)
        .decls.filter(({ text, within }) => text.startsWith(`${prop}:`) && within.length > 0 && test(within[within.length - 1]))
        .map(({ text }) => text.slice(prop.length + 1).trim());
    const candy = sheet("candy");

    // The board: the numeral grows with the board, but is floored at 14pt on a small one.
    const [size, ...more] = values(candy, "font-size", (s) => s === 'html[data-sdk-theme="candy"] .sdk-cell');
    expect(more, "one size for the cells").toEqual([]);
    const floor = size?.match(/^max\((.+),\s*([\d.]+)px\)$/);
    expect(floor, `the cells' font-size (${size}) is max(<the board's size>, <a floor in px>)`).not.toBeNull();
    expect(Number(floor![2]), "the cells' floor").toBeGreaterThanOrEqual(LARGE_BOLD);
    expect(floor![1], "above the floor, the board's own size").toBe(values(BASE, "font-size", (s) => s === ".sdk-cell")[0]);
    // Bold: every weight Candy gives a cell (a clue's, a twin's, the selection's) is 700 or more.
    const cell = /^html\[data-sdk-theme="candy"\] \.sdk-cell(\[[^\]]+\]|:not\([^)]*\))*$/;
    const weights = values(candy, "font-weight", (s) => cell.test(s));
    expect(weights.length).toBeGreaterThan(0);
    for (const w of weights) expect(Number(w), `a cell's weight ${w}`).toBeGreaterThanOrEqual(700);

    // The pad: a key's numeral is a fixed size, bold in Candy. (With notes on, the keys are unwrapped:
    // a numeral in its colour on the ground, which the digit colours already pass at 4.5:1.)
    const keySizes = values(BASE, "font-size", (s) => s === ".sdk-key-n");
    expect(keySizes.length).toBeGreaterThan(0);
    for (const s of keySizes) {
      expect(s, "a key's numeral in px").toMatch(/^[\d.]+px$/);
      expect(parseFloat(s), `a key's numeral at ${s}`).toBeGreaterThanOrEqual(LARGE_BOLD);
    }
    const keyWeights = values(candy, "font-weight", (s) => s === 'html[data-sdk-theme="candy"] .sdk-key-n');
    expect(keyWeights.length).toBeGreaterThan(0);
    for (const w of keyWeights) expect(Number(w), `a key's weight ${w}`).toBeGreaterThanOrEqual(700);
  });
});

/** Every rule's prelude (selector or at-rule) with its nesting, and each declaration's text with the at-rules around it. */
function walk(css: string) {
  const rules: { prelude: string; within: string[] }[] = [];
  const decls: { text: string; within: string[] }[] = [];
  const stack: string[] = [];
  let buf = "";
  for (const ch of css) {
    if (ch === "{") {
      const prelude = buf.trim();
      rules.push({ prelude, within: [...stack] });
      stack.push(prelude);
      buf = "";
    } else if (ch === "}") {
      if (buf.trim()) decls.push({ text: buf.trim(), within: [...stack] });
      stack.pop();
      buf = "";
    } else if (ch === ";") {
      decls.push({ text: buf.trim(), within: [...stack] });
      buf = "";
    } else buf += ch;
  }
  return { rules, decls };
}

describe.each(THEME_IDS.map((id) => [id]))("%s's stylesheet", (id) => {
  const { rules, decls } = walk(sheet(id));
  const Id = id[0].toUpperCase() + id.slice(1);

  it("scopes every rule and keyframes to the theme", () => {
    for (const { prelude, within } of rules) {
      if (within.some((w) => w.startsWith("@keyframes"))) continue;
      if (prelude.startsWith("@media") || prelude.startsWith("@supports")) continue;
      if (prelude.startsWith("@keyframes")) {
        expect(prelude, "keyframes are named sdk<Theme>…").toMatch(new RegExp(`^@keyframes sdk${Id}[A-Z]\\w*$`));
        continue;
      }
      if (prelude.startsWith("@property")) {
        expect(prelude).toMatch(new RegExp(`^@property --sdk-${id}-`));
        continue;
      }
      for (const selector of prelude.split(",")) {
        expect(selector.includes(`[data-sdk-theme="${id}"]`) || selector.includes(`.sdk-${id}-`), selector.trim()).toBe(true);
      }
    }
  });

  it("animates only under prefers-reduced-motion: no-preference", () => {
    for (const { text, within } of decls) {
      if (!/^animation(-name)?\s*:/.test(text) || /:\s*none$/.test(text)) continue;
      expect(within.some((w) => /prefers-reduced-motion:\s*no-preference/.test(w)), text).toBe(true);
    }
  });
});
