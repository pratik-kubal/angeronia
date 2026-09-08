#!/usr/bin/env node
// `npm run check:theme` — the gate that keeps the Angeronia brand override
// honest. Three checks, then a written report.
//
//   1. Parity    every `--cds-*` token assigned in `styles/_themes.scss` is a
//                token Carbon actually defines. A typo in an override is
//                otherwise silent: it declares a custom property nothing reads.
//   2. Contrast  every pairing the override creates, resolved in both themes,
//                against WCAG 2.2 AA.
//   3. Report    `docs/design-system/theme-report.md`, committed for review.
//
// This is deliberately narrower than the SLDS `check:theme` it replaces
// (ADR-018). Carbon publishes contrast guarantees for its own tokens and tests
// them upstream; re-deriving all 58 of those pairings here would be checking
// IBM's homework. What is *ours* is the teal — the ~20 tokens `brand-light` and
// `brand-dark` reassign — so that is what this checks, plus the site tokens the
// theme declares alongside them.
//
//   node scripts/check-contrast.mjs           check and rewrite the report
//   node scripts/check-contrast.mjs --check   also fail if the report is stale

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { themeTokens, compileSiteCss, ROOT } from "./carbon-tokens.mjs";
import { contrastRatio } from "./oklab.mjs";

const THEMES = resolve(ROOT, "styles/_themes.scss");
const REPORT = resolve(ROOT, "docs/design-system/theme-report.md");
const strict = process.argv.includes("--check");

// ── 1. Parity ────────────────────────────────────────────────────────────────

/** The `--cds-*` names the two brand mixins assign. */
function overriddenTokens() {
  const src = readFileSync(THEMES, "utf8");
  const names = new Set();
  for (const m of src.matchAll(/^\s*(--cds-[a-z0-9-]+)\s*:/gm)) names.add(m[1]);
  return [...names].sort();
}

/** The `--cds-*` names Carbon itself emits, taken from the compiled CSS. */
function carbonTokens(light) {
  return new Set([...light.keys()].filter((n) => n.startsWith("--cds-")));
}

// ── 2. Contrast ──────────────────────────────────────────────────────────────

/**
 * What each brand token has to stay legible against.
 *
 * `min` is 4.5 for anything that renders as text and 3.0 for a non-text UI
 * boundary — a border, a focus ring, an icon — which is WCAG 2.2's own split
 * (1.4.3 vs 1.4.11).
 */
const PAIRINGS = [
  // Links, on each ground a link can land on.
  { fg: "--cds-link-primary", bg: "--cds-background", min: 4.5, note: "link on the page" },
  { fg: "--cds-link-primary", bg: "--cds-layer-01", min: 4.5, note: "link on a shaded band" },
  { fg: "--cds-link-primary", bg: "--cds-layer-02", min: 4.5, note: "link on a card" },
  { fg: "--cds-link-primary-hover", bg: "--cds-background", min: 4.5, note: "link, hovered" },
  { fg: "--cds-link-secondary", bg: "--cds-background", min: 4.5, note: "secondary link" },

  // The brand button, and anything else that paints white on teal.
  { fg: "--cds-text-on-color", bg: "--cds-button-primary", min: 4.5, note: "primary button label" },
  {
    fg: "--cds-text-on-color",
    bg: "--cds-button-primary-hover",
    min: 4.5,
    note: "primary button, hovered",
  },
  {
    fg: "--cds-text-on-color",
    bg: "--cds-button-primary-active",
    min: 4.5,
    note: "primary button, pressed",
  },
  { fg: "--cds-text-on-color", bg: "--cds-background-brand", min: 4.5, note: "brand mark cursor" },

  // Non-text boundaries.
  { fg: "--cds-focus", bg: "--cds-background", min: 3, note: "focus ring on the page" },
  { fg: "--cds-focus", bg: "--cds-layer-01", min: 3, note: "focus ring on a shaded band" },
  { fg: "--cds-border-interactive", bg: "--cds-background", min: 3, note: "interactive edge" },
  { fg: "--cds-border-interactive", bg: "--cds-layer-01", min: 3, note: "the coda rule" },
  { fg: "--cds-icon-interactive", bg: "--cds-background", min: 3, note: "accent glyph" },
  { fg: "--cds-icon-interactive", bg: "--cds-layer-01", min: 3, note: "the demo phase marker" },

  // The syntax palette, on the ground the code pane actually uses.
  { fg: "--site-code-keyword", bg: "--cds-background", min: 4.5, note: "keyword" },
  { fg: "--site-code-string", bg: "--cds-background", min: 4.5, note: "string" },
  { fg: "--site-code-number", bg: "--cds-background", min: 4.5, note: "number" },
  { fg: "--site-code-comment", bg: "--cds-background", min: 4.5, note: "comment" },

  // The hero figure is decorative (`role="img"` with a label, nothing in the
  // page's meaning depends on it), so 3:1 against the page is the bar — it has
  // to be visible, not readable.
  { fg: "--site-figure-lit", bg: "--cds-background", min: 3, note: "Möbius, lit face" },
];

function check() {
  const css = compileSiteCss();
  const { light, dark } = themeTokens(css);

  const failures = [];

  const assigned = overriddenTokens();
  const known = carbonTokens(light);
  for (const name of assigned) {
    if (!known.has(name)) failures.push(`unknown Carbon token assigned in _themes.scss: ${name}`);
  }

  const rows = [];
  for (const pair of PAIRINGS) {
    const cells = [];
    for (const [scheme, tokens] of [
      ["light", light],
      ["dark", dark],
    ]) {
      const fg = tokens.get(pair.fg);
      const bg = tokens.get(pair.bg);
      if (!fg || !bg) {
        failures.push(`missing token in ${scheme}: ${!fg ? pair.fg : pair.bg}`);
        cells.push({ ratio: 0, pass: false, fg, bg });
        continue;
      }
      const ratio = contrastRatio(fg, bg);
      const pass = ratio + 1e-9 >= pair.min;
      if (!pass) {
        failures.push(
          `${scheme}: ${pair.fg} on ${pair.bg} is ${ratio.toFixed(2)}:1, needs ${pair.min}:1`,
        );
      }
      cells.push({ ratio, pass, fg, bg });
    }
    rows.push({ ...pair, cells });
  }

  return { assigned, rows, failures };
}

// ── 3. Report ────────────────────────────────────────────────────────────────

function report({ assigned, rows }) {
  const line = (r) => {
    const [l, d] = r.cells;
    const mark = (c) => `${c.ratio.toFixed(2)}:1 ${c.pass ? "✓" : "✗"}`;
    return `| ${r.note} | \`${r.fg.replace("--cds-", "").replace("--site-", "site/")}\` on \`${r.bg
      .replace("--cds-", "")
      .replace("--site-", "site/")}\` | ${r.min}:1 | ${mark(l)} | ${mark(d)} |`;
  };

  return `# Theme report — angeronia.com

Generated by \`npm run check:theme\` (\`scripts/check-contrast.mjs\`). Do not edit
by hand.

The site is IBM Carbon v11 under the White and Gray 100 themes, with one brand
override: Carbon's Blue 60 interactive family is replaced by Carbon Teal
(\`styles/_themes.scss\`). Every other Carbon token keeps its stock value, which
is why this report checks the teal and nothing else — Carbon tests its own
pairings upstream. See DECISIONS.md ADR-018.

## Tokens the brand override assigns

${assigned.length} \`--cds-*\` tokens, each verified to be a token Carbon defines:

${assigned.map((n) => `* \`${n}\``).join("\n")}

## Contrast

WCAG 2.2: 4.5:1 for text (1.4.3), 3:1 for non-text boundaries (1.4.11).

| What | Pairing | Needs | Light (White) | Dark (Gray 100) |
|---|---|---|---|---|
${rows.map(line).join("\n")}
`;
}

const result = check();
const next = report(result);
const previous = (() => {
  try {
    return readFileSync(REPORT, "utf8");
  } catch {
    return null;
  }
})();

if (previous !== next) {
  if (strict && previous !== null) {
    result.failures.push("docs/design-system/theme-report.md is out of date — run `npm run check:theme`");
  }
  writeFileSync(REPORT, next);
}

if (result.failures.length > 0) {
  for (const f of result.failures) console.error(`✗ ${f}`);
  process.exit(1);
}

console.log(
  `✓ ${result.assigned.length} brand tokens, ${result.rows.length * 2} pairings, all at WCAG AA`,
);
