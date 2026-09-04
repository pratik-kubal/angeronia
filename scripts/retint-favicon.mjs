#!/usr/bin/env node
// Re-tints `app/icon.svg` — the 112-facet Angeronia mark — from citron onto
// the IBM Carbon teal ramp (plan §2.8.6, decision D6/O10).
//
// The facets are a shaded solid: their colours encode lighting, not brand. So
// every fill and stroke keeps its OKLab lightness exactly and takes only its
// chroma (a, b) from the teal ramp, sampled at that lightness. Above Teal 10
// the chroma fades toward white, below Teal 100 toward black, so highlights and
// core shadows stay clean instead of clipping to a flat teal.
//
// Because lightness is preserved, the transform is idempotent: running it on
// its own output is a no-op.
//
//   node scripts/retint-favicon.mjs           rewrite app/icon.svg in place
//   node scripts/retint-favicon.mjs --check   exit 1 if it would change
//   node scripts/retint-favicon.mjs <in> <out>

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import colors from "@carbon/colors";
import { rgbToOklab, oklabToRgb, parseColor, toHex } from "./oklab.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const DEFAULT_FILE = resolve(here, "../app/icon.svg");

// The Carbon teal ramp in OKLab, darkest first — the chroma curve we sample.
const RAMP = [100, 90, 80, 70, 60, 50, 40, 30, 20, 10].map((step) => ({
  step,
  lab: rgbToOklab(parseColor(colors.teal[step])),
}));

const DARKEST = RAMP[0];
const LIGHTEST = RAMP[RAMP.length - 1];

/** Chroma `[a, b]` of the teal ramp at lightness `L`. */
function chromaAt(L) {
  if (L <= DARKEST.lab[0]) {
    // Below the ramp: fade toward black, which has no chroma.
    const f = DARKEST.lab[0] === 0 ? 0 : L / DARKEST.lab[0];
    return [DARKEST.lab[1] * f, DARKEST.lab[2] * f];
  }
  if (L >= LIGHTEST.lab[0]) {
    // Above the ramp: fade toward white, which has no chroma.
    const f = (1 - L) / (1 - LIGHTEST.lab[0]);
    return [LIGHTEST.lab[1] * f, LIGHTEST.lab[2] * f];
  }
  let i = 0;
  while (!(L >= RAMP[i].lab[0] && L <= RAMP[i + 1].lab[0])) i++;
  const [lo, hi] = [RAMP[i], RAMP[i + 1]];
  const f = (L - lo.lab[0]) / (hi.lab[0] - lo.lab[0]);
  return [
    lo.lab[1] + (hi.lab[1] - lo.lab[1]) * f,
    lo.lab[2] + (hi.lab[2] - lo.lab[2]) * f,
  ];
}

/** One colour, lightness preserved, chroma taken from the teal ramp. */
export function retint(color) {
  const [L] = rgbToOklab(parseColor(color));
  return toHex(oklabToRgb([L, ...chromaAt(L)]));
}

/** One re-tinting pass over every `rgb(...)` and `#rrggbb` in an SVG. */
function retintPass(svg) {
  return svg.replace(/rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)|#[0-9a-fA-F]{6}\b/g, (match) =>
    retint(match),
  );
}

/**
 * Every colour in an SVG, re-tinted to a fixed point.
 *
 * A single pass is not quite idempotent: rounding OKLab back to 8-bit sRGB can
 * move a channel by one, which the next pass would then re-tint again. Four
 * passes settle the citron mark; iterating to a fixed point makes the committed
 * file stable, so `--check` means "already on the ramp" and not "off by a
 * rounding step".
 */
export function retintSvg(svg) {
  let current = svg;
  for (let pass = 0; pass < 16; pass++) {
    const next = retintPass(current);
    if (next === current) return current;
    current = next;
  }
  throw new Error("re-tint did not converge after 16 passes");
}

function main() {
  const args = process.argv.slice(2);
  const check = args.includes("--check");
  const paths = args.filter((a) => !a.startsWith("--"));
  const input = paths[0] ? resolve(paths[0]) : DEFAULT_FILE;
  const output = paths[1] ? resolve(paths[1]) : input;

  const before = readFileSync(input, "utf8");
  const after = retintSvg(before);

  if (check) {
    if (before !== after) {
      console.error(`${input} is not on the teal ramp — run \`npm run build:favicon\`.`);
      process.exit(1);
    }
    console.log(`${input} is on the teal ramp.`);
    return;
  }

  writeFileSync(output, after);
  const distinct = new Set(after.match(/#[0-9a-fA-F]{6}/g) ?? []).size;
  console.log(`re-tinted ${output} — ${distinct} distinct teal facet colours`);
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) main();
