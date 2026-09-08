#!/usr/bin/env node
// Regenerates the OG/social lockups `public/angeronia-logo-light.png` and
// `-dark.png` (500 × 500) from the brand mark, on the teal ramp (plan §2.8.6).
//
// Every colour is resolved out of `app/theme.angeronia.css` + the Cosmos
// tokens rather than typed in, so the rasters cannot drift from the site:
//
//   ground     --slds-g-color-surface-1
//   disc       --slds-g-color-accent-container-1   (Teal 60, both schemes)
//   cursor     --slds-g-color-on-accent-1          (white)
//   wordmark   --slds-g-color-on-surface-3
//   sub-line   --slds-g-color-on-surface-1
//
// The wordmark is IBM Plex Sans (D11), converted to outlines with opentype.js
// so the render needs no system font. The mark and wordmark are set clear of
// each other: heading ink over Teal 60 is only 3.6:1 in the light scheme, so
// the disc is never used as a background for type.
//
// Needs `rsvg-convert` (librsvg) or ImageMagick on PATH.
//
//   node scripts/build-logos.mjs

import { writeFileSync, readFileSync, mkdtempSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";
import { tmpdir } from "node:os";
import opentype from "opentype.js";
import { parseFile, merge, resolveHook } from "./slds-tokens.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const TOKENS = resolve(root, "node_modules/@salesforce-ux/design-tokens/dist/themes/cosmos");
const FONT = resolve(root, "node_modules/@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-600-normal.woff");

const SIZE = 500;

// The mark, in the 32-unit space `components/site/brand-mark.tsx` uses, so the
// raster and the live SVG stay the same drawing.
const MARK = {
  box: 32,
  disc: { cx: 17.5, cy: 16, r: 12.5 },
  cursor: "M11.2 7.6 L23.4 14.1 L16.9 15.4 L20.2 22.1 L17.1 23.5 L13.8 16.8 L9.4 21.2 Z",
};

const tokens = merge(
  parseFile(`${TOKENS}/cosmos.reference.tokens.css`),
  parseFile(`${TOKENS}/cosmos.global.tokens.css`),
  parseFile(`${TOKENS}/cosmos.shared.tokens.css`),
  parseFile(resolve(root, "app/theme.angeronia.css")),
);

const fontBuffer = readFileSync(FONT);
const font = opentype.parse(
  fontBuffer.buffer.slice(fontBuffer.byteOffset, fontBuffer.byteOffset + fontBuffer.byteLength),
);

/** Advance width of `text` at `size`, in px. */
function widthOf(text, size) {
  return font.getAdvanceWidth(text, size);
}

/** `text` as SVG path data, centred on `cx` with its baseline at `y`. */
function centredPath(text, size, cx, y) {
  const x = cx - widthOf(text, size) / 2;
  return font.getPath(text, x, y, size).toPathData(2);
}

/** Letter-spaced caps as a single path, centred on `cx`. */
function trackedPath(text, size, tracking, cx, y) {
  const total =
    [...text].reduce((sum, ch) => sum + widthOf(ch, size), 0) + tracking * (text.length - 1);
  let x = cx - total / 2;
  const parts = [];
  for (const ch of text) {
    parts.push(font.getPath(ch, x, y, size).toPathData(2));
    x += widthOf(ch, size) + tracking;
  }
  return parts.join(" ");
}

function lockup(scheme) {
  const c = (hook) => resolveHook(`--slds-g-color-${hook}`, tokens, scheme);
  const ground = c("surface-1");
  const disc = c("accent-container-1");
  const cursor = c("on-accent-1");
  const ink = c("on-surface-3");
  const quiet = c("on-surface-1");

  const cx = SIZE / 2;
  const markSize = 136;
  const s = markSize / MARK.box;
  // Centre the disc, not the 32-unit box: the disc is the optical centre.
  const tx = cx - MARK.disc.cx * s;
  const ty = 180 - MARK.disc.cy * s;

  const wordSize = 58;
  const subSize = 17;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <rect width="${SIZE}" height="${SIZE}" fill="${ground}"/>
  <g transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${s.toFixed(4)})">
    <circle cx="${MARK.disc.cx}" cy="${MARK.disc.cy}" r="${MARK.disc.r}" fill="${disc}"/>
    <path d="${MARK.cursor}" fill="${cursor}"/>
  </g>
  <path d="${centredPath("Angeronia Labs", wordSize, cx, 322)}" fill="${ink}"/>
  <rect x="${(cx - 90).toFixed(2)}" y="350" width="180" height="1.5" fill="${quiet}"/>
  <path d="${trackedPath("PHILADELPHIA", subSize, 4.6, cx, 382)}" fill="${quiet}"/>
</svg>`;
}

function rasterise(svg, out) {
  const dir = mkdtempSync(join(tmpdir(), "angeronia-logo-"));
  const svgPath = join(dir, "lockup.svg");
  writeFileSync(svgPath, svg);
  try {
    execFileSync("rsvg-convert", ["-w", String(SIZE), "-h", String(SIZE), "-o", out, svgPath]);
  } catch {
    execFileSync("magick", ["-background", "none", "-density", "288", svgPath, "-resize", `${SIZE}x${SIZE}`, out]);
  }
}

for (const scheme of ["light", "dark"]) {
  const out = resolve(root, `public/angeronia-logo-${scheme}.png`);
  const svg = lockup(scheme);
  writeFileSync(resolve(root, `public/angeronia-logo-${scheme}.svg`), svg);
  rasterise(svg, out);
  console.log(`wrote public/angeronia-logo-${scheme}.{svg,png}`);
}
