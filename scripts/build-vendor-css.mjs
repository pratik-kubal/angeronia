#!/usr/bin/env node
// Assembles the SLDS 2 vendor stylesheet into `vendor/slds2.css`, which
// `app/slds.css` imports.
//
// Why this step exists at all: the published `@salesforce-ux/design-system-2`
// dist references eight Salesforce image assets it does not ship —
// `url('../../public/profile_avatar_*.png')` and friends, left dangling for a
// Salesforce app to serve. A bundler resolves `url()` statically, so importing
// the vendor CSS as-is fails the build outright:
//
//     Module not found: Can't resolve '../../public/profile_avatar_96.png'
//
// Every one of those eight is Salesforce artwork — default profile and group
// avatars, the Einstein figure and header background, the Welcome Mat ground —
// which D10 puts out of scope regardless. So this replaces each with `none`.
// The vendor files on disk are never touched; the removal list is asserted, so
// a design-system bump that adds a ninth reference fails here rather than
// smuggling artwork into the bundle.
//
//   node scripts/build-vendor-css.mjs                assemble (bundled)
//   node scripts/build-vendor-css.mjs --mode=modular assemble (modular spike)
//   node scripts/build-vendor-css.mjs --measure      print both sizes, write nothing

import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const DIST = resolve(root, "node_modules/@salesforce-ux/design-system-2/dist");
const OUT = resolve(root, "vendor/slds2.css");

/**
 * What the site ships. `modular` — 37 KB gzip against the bundle's 108 KB,
 * with all 1400 computed values verified identical across both colour schemes
 * by `scripts/compare-vendor-css.mjs`. See DECISIONS.md ADR-004.
 */
const DEFAULT_MODE = "modular";

/**
 * The Salesforce artwork the dist points at but does not ship. Exact list —
 * `assertArtworkRefs` fails if the CSS references anything outside it, or if a
 * name here stops appearing (in which case delete the stale entry).
 */
const SALESFORCE_ARTWORK = [
  "bg-info@2x.png",
  "einstein-figure.svg",
  "einstein-header-background.svg",
  "group_avatar_96.png",
  "group_avatar_160.png",
  "group_avatar_200.png",
  "profile_avatar_96.png",
  "profile_avatar_160.png",
  "profile_avatar_200.png",
];

/**
 * Which dist stylesheet backs each wrapper in `components/slds/`.
 *
 * `null` means "no component CSS of its own" — the wrapper is built from
 * utilities, which are always included. `assertManifestCoversWrappers` fails
 * if a wrapper folder appears with no entry here, which is the one way the
 * modular build could silently ship a component with no styling.
 */
const WRAPPER_TO_DIST = {
  avatar: "avatar/avatar.css",
  badge: "badge/badge.css",
  button: "button/button.css",
  "button-group": "buttonGroup/buttonGroup.css",
  "button-icon": "buttonIcon/buttonIcon.css",
  card: "card/card.css",
  icon: "icon/icon.css",
  layout: null, // grid, box and container utilities
  link: null, // base stylesheet styles a bare <a>
  list: null, // vertical / horizontal / dotted list utilities
  "media-object": null, // mediaObject utility
  path: "path/path.css",
  "progress-bar": "progressBar/progressBar.css",
  "progress-indicator": "progressIndicator/progressIndicator.css",
  text: null, // text utilities
  tile: "tile/tile.css",
};

/**
 * The modular manifest: what the site and Storybook actually render. Adding a
 * component here is part of adding its wrapper — see DESIGN-RULES.md rung 2.
 */
const MODULAR = {
  defaults: ["utilities/reset.css"],
  component: [
    // Utilities
    "utilities/darkMode.css",
    "utilities/grid.css",
    "utilities/layout.css",
    "utilities/alignment.css",
    "utilities/margin.css",
    "utilities/padding.css",
    "utilities/sizing.css",
    "utilities/position.css",
    "utilities/text.css",
    "utilities/color.css",
    "utilities/borders.css",
    "utilities/box.css",
    "utilities/mediaObject.css",
    "utilities/verticalList.css",
    "utilities/horizontalList.css",
    "utilities/descriptionList.css",
    "utilities/truncate.css",
    "utilities/lineClamp.css",
    "utilities/hyphenation.css",
    "utilities/interactions.css",
    "utilities/scrolling.css",
    "utilities/visibility.css",
    "utilities/floats.css",
    "utilities/print.css",
    // Components
    "avatar/avatar.css",
    "badge/badge.css",
    "button/button.css",
    "buttonGroup/buttonGroup.css",
    "buttonIcon/buttonIcon.css",
    "card/card.css",
    "icon/icon.css",
    "path/path.css",
    "pill/pill.css",
    "progressBar/progressBar.css",
    "progressIndicator/progressIndicator.css",
    "spinner/spinner.css",
    "tile/tile.css",
  ],
};

/**
 * Fail if `components/slds/` has a wrapper the manifest does not account for.
 *
 * The bundled build cannot have this problem — it contains everything. The
 * modular one can, and the symptom would be an unstyled component rather than
 * an error, so it is worth an explicit check.
 */
function assertManifestCoversWrappers() {
  let wrappers;
  try {
    wrappers = readdirSync(resolve(root, "components/slds"), { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name);
  } catch {
    return; // no wrappers yet
  }

  const missing = wrappers.filter((name) => !(name in WRAPPER_TO_DIST));
  if (missing.length) {
    console.error(
      `components/slds/${missing.join(", ")} has no entry in WRAPPER_TO_DIST ` +
        "(scripts/build-vendor-css.mjs).\nAdd the dist stylesheet it needs to " +
        "MODULAR.component, or `null` if it is built from utilities.",
    );
    process.exit(1);
  }

  const needed = wrappers
    .map((name) => WRAPPER_TO_DIST[name])
    .filter((file) => file !== null && file !== undefined);
  const absent = needed.filter((file) => !MODULAR.component.includes(file));
  if (absent.length) {
    console.error(
      `the modular manifest is missing: ${absent.join(", ")}.\n` +
        "Add them to MODULAR.component in scripts/build-vendor-css.mjs.",
    );
    process.exit(1);
  }
}

/** Fail unless every dangling artwork reference is one we expect. */
function assertArtworkRefs(css, label) {
  const refs = [...css.matchAll(/url\(\s*['"]?\.\.\/\.\.\/public\/([^)'"]+)['"]?\s*\)/g)].map(
    (m) => m[1],
  );
  const unexpected = [...new Set(refs)].filter((name) => !SALESFORCE_ARTWORK.includes(name));
  if (unexpected.length) {
    console.error(
      `${label}: unrecognised Salesforce asset reference(s): ${unexpected.join(", ")}.\n` +
        "Add them to SALESFORCE_ARTWORK in scripts/build-vendor-css.mjs after checking " +
        "they are artwork and not something the site needs.",
    );
    process.exit(1);
  }
  return refs.length;
}

/** Replace every dangling artwork `url()` with `none`. */
function stripArtwork(css) {
  return css.replace(/url\(\s*['"]?\.\.\/\.\.\/public\/[^)'"]+['"]?\s*\)/g, "none");
}

function header(mode, stripped) {
  return [
    "/*",
    " * GENERATED by scripts/build-vendor-css.mjs — do not edit.",
    ` * Source: @salesforce-ux/design-system-2 ${pkgVersion()} (${mode} build).`,
    ` * ${stripped} dangling Salesforce artwork url() reference(s) replaced with \`none\`;`,
    " * see the script header and docs/design-system/DECISIONS.md ADR-004.",
    " * Regenerate with `npm run build:css`.",
    " */",
    "",
  ].join("\n");
}

function pkgVersion() {
  return JSON.parse(
    readFileSync(resolve(root, "node_modules/@salesforce-ux/design-system-2/package.json"), "utf8"),
  ).version;
}

function buildBundled() {
  const css = readFileSync(`${DIST}/css/bundled/slds2.cosmos.css`, "utf8");
  const stripped = assertArtworkRefs(css, "bundled");
  return header("bundled", stripped) + stripArtwork(css);
}

function buildModular() {
  assertManifestCoversWrappers();

  const parts = [
    "@layer deprecated, defaults, shared, theme, component;",
    "",
    readFileSync(`${DIST}/css/modular/slds2.theme.cosmos.css`, "utf8"),
  ];
  let stripped = 0;

  for (const [layer, files] of Object.entries(MODULAR)) {
    for (const file of files) {
      const css = readFileSync(`${DIST}/components/${file}`, "utf8");
      stripped += assertArtworkRefs(css, file);
      parts.push(`@layer ${layer} {`, stripArtwork(css), "}");
    }
  }

  return header("modular", stripped) + parts.join("\n");
}

const args = process.argv.slice(2);
const mode = args.find((a) => a.startsWith("--mode="))?.split("=")[1] ?? DEFAULT_MODE;

const size = (s) => `${(Buffer.byteLength(s) / 1024).toFixed(0)} KB raw / ${(gzipSync(s).length / 1024).toFixed(0)} KB gzip`;

if (args.includes("--measure")) {
  console.log(`bundled: ${size(buildBundled())}`);
  console.log(`modular: ${size(buildModular())}`);
  process.exit(0);
}

if (mode !== "bundled" && mode !== "modular") {
  console.error(`unknown --mode=${mode}; expected "bundled" or "modular".`);
  process.exit(1);
}

const css = mode === "bundled" ? buildBundled() : buildModular();
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, css);
console.log(`wrote vendor/slds2.css — ${mode}, ${size(css)}`);
