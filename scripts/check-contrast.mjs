// The contrast gate (DECISIONS.md ADR-030): `npm run check:contrast`.
//
// Reads styles/tokens.css and nothing else. The pairs are declared there, beside
// the tokens, as lines of the form
//
//   @contrast <foreground> on <background> <text|large|ui> <use>
//
// and each is checked in every band: in :root, and in each [data-band="…"] set,
// which inherits from :root and overrides it. var() chains are followed. WCAG
// 2.2 AA: 4.5:1 for text, 3:1 for large text and for ui (non-text: the spine, a
// focus ring). Exit 1 on a pair under its bar, a token it cannot resolve to a
// hex colour, or no pairs at all.
//
// Adapted from the contrast script of PR #10 (its pairs lived in the script;
// here they live with the tokens).
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const FILE = fileURLToPath(new URL("../styles/tokens.css", import.meta.url));
const MINIMUM = { text: 4.5, large: 3, ui: 3 };

const source = readFileSync(FILE, "utf8");
const css = source.replace(/\/\*[\s\S]*?\*\//g, "");

// ── The pairs ───────────────────────────────────────────────────────────────
const pairs = [...source.matchAll(/@contrast\s+(--[\w-]+)\s+on\s+(--[\w-]+)\s+(\w+)\s+([^\n]*)/g)].map(
  ([, fg, bg, kind, use]) => {
    if (!(kind in MINIMUM)) fail(`@contrast ${fg} on ${bg}: unknown kind "${kind}" (text, large or ui)`);
    return { fg, bg, kind, use: use.trim() };
  },
);
if (pairs.length === 0) fail("no @contrast pairs declared in styles/tokens.css");

// ── The scopes: :root, then each band ──────────────────────────────────────
// Only top-level rules count; a :root inside a media query changes lengths, not
// colours, and is ignored.
const topLevel = [];
{
  let depth = 0;
  let start = 0;
  let selector = "";
  for (let i = 0; i < css.length; i++) {
    const c = css[i];
    if (c === "{") {
      if (depth === 0) {
        selector = css.slice(start, i).trim();
        start = i + 1;
      }
      depth++;
    } else if (c === "}") {
      depth--;
      if (depth === 0) {
        if (!selector.startsWith("@")) topLevel.push({ selector, body: css.slice(start, i) });
        start = i + 1;
      }
    }
  }
}

const declarations = (body) =>
  Object.fromEntries([...body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map(([, name, value]) => [name, value.trim()]));

const root = {};
const bands = new Map(); // name -> declarations
for (const { selector, body } of topLevel) {
  for (const part of selector.split(",").map((s) => s.trim())) {
    const band = part.match(/^\[data-band="([\w-]+)"\]$/);
    if (part === ":root") Object.assign(root, declarations(body));
    else if (band) bands.set(band[1], { ...(bands.get(band[1]) ?? {}), ...declarations(body) });
  }
}
const scopes = [[":root", root], ...[...bands].map(([name, decls]) => [`[data-band="${name}"]`, { ...root, ...decls }])];

// ── Colour maths ───────────────────────────────────────────────────────────
function resolve(name, scope, seen = []) {
  if (seen.includes(name)) throw new Error(`a var() cycle: ${[...seen, name].join(" -> ")}`);
  const value = scope[name];
  if (value === undefined) throw new Error(`${name} is not declared`);
  const ref = value.match(/^var\(\s*(--[\w-]+)\s*\)$/);
  if (ref) return resolve(ref[1], scope, [...seen, name]);
  const hex = value.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!hex) throw new Error(`${name} is "${value}", not a hex colour`);
  const h = hex[1].length === 3 ? [...hex[1]].map((c) => c + c).join("") : hex[1];
  return `#${h.toLowerCase()}`;
}

const luminance = (hex) => {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

// ── Check ──────────────────────────────────────────────────────────────────
let failures = 0;
const rows = [];
for (const [scopeName, scope] of scopes) {
  for (const { fg, bg, kind, use } of pairs) {
    try {
      const f = resolve(fg, scope);
      const b = resolve(bg, scope);
      const value = ratio(f, b);
      const ok = value >= MINIMUM[kind];
      if (!ok) failures++;
      rows.push(
        `| ${scopeName} | \`${fg}\` on \`${bg}\` | ${f} on ${b} | ${value.toFixed(2)} | ${MINIMUM[kind]} (${kind}) | ${ok ? "pass" : "**FAIL**"} | ${use} |`,
      );
    } catch (error) {
      failures++;
      rows.push(`| ${scopeName} | \`${fg}\` on \`${bg}\` | — | — | ${MINIMUM[kind]} (${kind}) | **FAIL**: ${error.message} | ${use} |`);
    }
  }
}

console.log(
  [
    "Contrast, from styles/tokens.css (WCAG 2.2 AA)",
    "",
    "| Band | Pair | Colours | Ratio | Minimum | Result | Use |",
    "|---|---|---|---:|---|---|---|",
    ...rows,
    "",
    `${pairs.length} pairs × ${scopes.length} bands = ${rows.length} checks, ${failures} failing.`,
  ].join("\n"),
);
if (failures) process.exit(1);

function fail(message) {
  console.error(`check:contrast: ${message}`);
  process.exit(1);
}
