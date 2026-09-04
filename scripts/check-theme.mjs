#!/usr/bin/env node
// `npm run check:theme` — the gate that keeps the Angeronia theme layer honest
// (plan §2.8.4). Four checks, then a written report.
//
//   1. Parity      every hook assigned in `app/theme.angeronia.css` is a hook
//                  Cosmos already defines; nothing new is invented; block A is
//                  byte-for-byte what `build-theme.mjs` generates.
//   2. Blue sweep  the semantic hooks Cosmos hard-codes in blue are re-derived
//                  from the shipped tokens and must equal block B's keys — so a
//                  `@salesforce-ux/design-system-2` bump that adds or removes
//                  one fails here instead of drifting silently.
//   3. Contrast    every pairing SLDS defines, resolved in both schemes,
//                  against WCAG 2.2 AA.
//   4. Report      `docs/design-system/theme-report.md`, committed for review
//                  and rendered by the Storybook Brand board.
//
//   node scripts/check-theme.mjs           check and rewrite the report
//   node scripts/check-theme.mjs --check   also fail if the report is stale

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { parseFile, parseDeclarations, merge, resolveHook } from "./slds-tokens.mjs";
import { contrastRatio, parseColor } from "./oklab.mjs";
import { generateBlockA, BEGIN, END, brandRamp } from "./build-theme.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const THEME = resolve(root, "app/theme.angeronia.css");
const REPORT = resolve(root, "docs/design-system/theme-report.md");
const TOKENS = resolve(root, "node_modules/@salesforce-ux/design-tokens/dist/themes/cosmos");

const AA_TEXT = 4.5;
const AA_NON_TEXT = 3;

const failures = [];
const fail = (check, message) => failures.push(`${check}: ${message}`);

// ── Load ──────────────────────────────────────────────────────────────────────

const reference = parseFile(`${TOKENS}/cosmos.reference.tokens.css`);
const global = parseFile(`${TOKENS}/cosmos.global.tokens.css`);
const shared = parseFile(`${TOKENS}/cosmos.shared.tokens.css`);
const cosmos = merge(reference, global, shared);

const themeSource = readFileSync(THEME, "utf8");
const angeroniaOverrides = parseDeclarations(themeSource);
const angeronia = merge(cosmos, angeroniaOverrides);

// ── 1. Parity ─────────────────────────────────────────────────────────────────

for (const name of angeroniaOverrides.keys()) {
  if (!cosmos.has(name)) {
    fail("parity", `${name} is assigned by the theme layer but Cosmos does not define it`);
  }
}

// The theme layer may only assign design-system hooks — never invent a
// namespace of its own, and never reach into component-level hooks (which are
// a developer preview upstream; design rule 3).
for (const name of angeroniaOverrides.keys()) {
  if (!/^--slds-[rgs]-/.test(name)) {
    fail("parity", `${name} is outside the --slds-r/g/s namespaces`);
  }
}

{
  const start = themeSource.indexOf(BEGIN);
  const stop = themeSource.indexOf(END);
  if (start === -1 || stop === -1) {
    fail("parity", "block A markers are missing from app/theme.angeronia.css");
  } else {
    const actual = themeSource.slice(start, stop + END.length) + "\n";
    if (actual !== generateBlockA()) {
      fail("parity", "block A differs from scripts/build-theme.mjs output — run `npm run build:theme`");
    }
  }
}

// Type: block C owns exactly the two font-family hooks and nothing else.
{
  const fontHooks = [...angeroniaOverrides.keys()].filter((n) => n.includes("-font-"));
  const expected = ["--slds-g-font-family-base", "--slds-g-font-family-monospace"];
  const unexpected = fontHooks.filter((n) => !expected.includes(n));
  if (unexpected.length) {
    fail("parity", `the theme layer touches non-family font hooks: ${unexpected.join(", ")}`);
  }
  for (const hook of expected) {
    if (!angeroniaOverrides.has(hook)) fail("parity", `block C is missing ${hook}`);
  }
}

// ── 2. Blue-literal sweep ─────────────────────────────────────────────────────

/** Hue in degrees, or null for a neutral. */
function hue(color) {
  const [r, g, b] = parseColor(color).map((c) => c / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  if (d === 0) return null;
  let h;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h *= 60;
  return h < 0 ? h + 360 : h;
}

/**
 * Semantic global hooks (not `palette-`, not `-base-`) whose Cosmos value
 * contains a literal hex in the blue range. These are the hooks the reference
 * ramp swap cannot reach, so block B has to override them by hand.
 */
function blueLiteralHooks() {
  const found = [];
  for (const [name, value] of global) {
    if (!name.startsWith("--slds-g-color-")) continue;
    if (name.includes("palette-") || name.includes("-base-")) continue;
    const hexes = value.match(/#[0-9a-fA-F]{3,8}/g) ?? [];
    if (hexes.some((h) => { const d = hue(h); return d !== null && d >= 200 && d <= 260; })) {
      found.push(name);
    }
  }
  return found.sort();
}

const blueHooks = blueLiteralHooks();
const blockBKeys = [...angeroniaOverrides.keys()]
  .filter((n) => n.startsWith("--slds-g-color-"))
  .sort();

for (const name of blueHooks) {
  if (!blockBKeys.includes(name)) {
    fail("blue-sweep", `${name} still carries a Cosmos blue literal but block B does not override it`);
  }
}
for (const name of blockBKeys) {
  if (!blueHooks.includes(name)) {
    fail("blue-sweep", `${name} is overridden by block B but is no longer a blue literal in Cosmos — drop it`);
  }
}

// Block B may reference the brand ramp, never a hex of its own.
for (const [name, value] of angeroniaOverrides) {
  if (!name.startsWith("--slds-g-color-")) continue;
  if (/#[0-9a-fA-F]{3,8}/.test(value)) {
    fail("blue-sweep", `${name} hard-codes a colour; block B must reference --slds-r-color-brand-*`);
  }
}

// ── 3. Contrast matrix ────────────────────────────────────────────────────────

const SURFACES = [
  "surface-1",
  "surface-2",
  "surface-3",
  "surface-container-1",
  "surface-container-2",
  "surface-container-3",
];

/** @type {{fg: string, bg: string, min: number, note: string}[]} */
const PAIRS = [
  ...[1, 2, 3].map((n) => ({
    fg: `on-accent-${n}`,
    bg: `accent-container-${n}`,
    min: AA_TEXT,
    note: "text on an accent container",
  })),
  ...["accent-2", "accent-3"].flatMap((fg) =>
    SURFACES.map((bg) => ({ fg, bg, min: AA_TEXT, note: "link / accent text on a surface" })),
  ),
  ...SURFACES.map((bg) => ({
    fg: "on-surface-3",
    bg,
    min: AA_TEXT,
    note: "heading ink on a surface",
  })),
  ...[1, 2].map((n) => ({
    fg: `on-surface-inverse-${n}`,
    bg: `surface-inverse-${n}`,
    min: AA_TEXT,
    note: "text on an inverse surface",
  })),
  ...SURFACES.map((bg) => ({
    fg: "brand-base-15",
    bg,
    min: AA_NON_TEXT,
    note: "focus ring against a surface",
  })),
];

const matrix = { light: [], dark: [] };
for (const scheme of ["light", "dark"]) {
  for (const pair of PAIRS) {
    const fg = resolveHook(`--slds-g-color-${pair.fg}`, angeronia, scheme);
    const bg = resolveHook(`--slds-g-color-${pair.bg}`, angeronia, scheme);
    const ratio = contrastRatio(fg, bg);
    const cosmosRatio = contrastRatio(
      resolveHook(`--slds-g-color-${pair.fg}`, cosmos, scheme),
      resolveHook(`--slds-g-color-${pair.bg}`, cosmos, scheme),
    );
    const pass = ratio >= pair.min;
    if (!pass) {
      fail(
        "contrast",
        `${scheme}: ${pair.fg} on ${pair.bg} is ${ratio.toFixed(2)}:1, below the ${pair.min}:1 minimum`,
      );
    }
    matrix[scheme].push({ ...pair, fg_value: fg, bg_value: bg, ratio, cosmosRatio, pass });
  }
}

// ── 4. Report ─────────────────────────────────────────────────────────────────

function reportBody() {
  const stamp = new Date().toISOString().slice(0, 10);
  const ramp = brandRamp();
  const lines = [];

  lines.push("# Theme report — Angeronia on SLDS 2 Cosmos");
  lines.push("");
  lines.push("<!-- Generated by `npm run check:theme`. Do not edit by hand. -->");
  lines.push("");
  lines.push(
    `Generated ${stamp} against \`@salesforce-ux/design-tokens\` ` +
      `${JSON.parse(readFileSync(resolve(root, "node_modules/@salesforce-ux/design-tokens/package.json"), "utf8")).version}.`,
  );
  lines.push("");
  lines.push(`**Result: ${failures.length === 0 ? "pass" : `${failures.length} failure(s)`}.**`);
  lines.push("");

  lines.push("## Brand reference ramp (block A)");
  lines.push("");
  lines.push("| SLDS step | Source | Angeronia | Cosmos |");
  lines.push("|---|---|---|---|");
  for (const { step, source, hex } of [...ramp].reverse()) {
    lines.push(`| ${step} | ${source} | \`${hex}\` | \`${reference.get(`--slds-r-color-brand-${step}`)}\` |`);
  }
  lines.push("");

  lines.push("## Semantic overrides (block B)");
  lines.push("");
  lines.push("Cosmos hard-codes these in blue, so the ramp swap cannot reach them.");
  lines.push("");
  lines.push("| Hook | Cosmos | Angeronia light | Angeronia dark |");
  lines.push("|---|---|---|---|");
  for (const name of blueHooks) {
    lines.push(
      `| \`${name.replace("--slds-g-color-", "")}\` | \`${global.get(name)}\` | ` +
        `\`${resolveHook(name, angeronia, "light")}\` | \`${resolveHook(name, angeronia, "dark")}\` |`,
    );
  }
  lines.push("");

  for (const scheme of ["light", "dark"]) {
    lines.push(`## Contrast matrix — ${scheme}`);
    lines.push("");
    lines.push("| Foreground | Background | Ratio | Min | Cosmos | |");
    lines.push("|---|---|---:|---:|---:|---|");
    for (const row of matrix[scheme]) {
      lines.push(
        `| \`${row.fg}\` \`${row.fg_value}\` | \`${row.bg}\` \`${row.bg_value}\` | ` +
          `${row.ratio.toFixed(2)}:1 | ${row.min}:1 | ${row.cosmosRatio.toFixed(2)}:1 | ` +
          `${row.pass ? "pass" : "**FAIL**"} |`,
      );
    }
    lines.push("");
  }

  lines.push("## Notes");
  lines.push("");
  lines.push(
    "* Ratios are WCAG 2.x relative-luminance contrast. Text pairs are held to " +
      "AA 4.5:1; the focus ring, which carries no text, to the 3:1 non-text minimum.",
  );
  lines.push(
    "* The Cosmos column is the same pairing on the unmodified electric-blue " +
      "theme — it is context, not a target. Teal 60 is a luminance twin of " +
      "Cosmos's `#066afe`, so the two columns track each other closely.",
  );
  lines.push(
    "* Dark-scheme values come from the second argument of each `light-dark()`; " +
      "Cosmos maps `brand-base-N` to `light-dark(r-N, r-(100−N))`, so the ramp is " +
      "used mirrored and needs no separate dark palette.",
  );
  lines.push("");
  return lines.join("\n");
}

const body = reportBody();
const stale = (() => {
  try {
    // Ignore the generation date when deciding staleness.
    const strip = (s) => s.replace(/^Generated \d{4}-\d{2}-\d{2} /m, "Generated ");
    return strip(readFileSync(REPORT, "utf8")) !== strip(body);
  } catch {
    return true;
  }
})();

if (process.argv.includes("--check")) {
  if (stale) fail("report", "docs/design-system/theme-report.md is stale — run `npm run check:theme`");
} else {
  writeFileSync(REPORT, body);
}

// ── Result ────────────────────────────────────────────────────────────────────

const counts = {
  parity: angeroniaOverrides.size,
  blue: blueHooks.length,
  contrast: matrix.light.length + matrix.dark.length,
};

if (failures.length) {
  console.error("check:theme FAILED\n");
  for (const f of failures) console.error(`  ${f}`);
  console.error("");
  process.exit(1);
}

console.log(
  `check:theme ok — ${counts.parity} hooks assigned, ${counts.blue} blue literals covered, ` +
    `${counts.contrast} contrast pairs at AA.`,
);
