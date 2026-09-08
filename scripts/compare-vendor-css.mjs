#!/usr/bin/env node
// Compares the bundled and modular vendor builds by computed style, so the
// choice between them is a measurement rather than a guess (plan §8 Phase 1.7,
// §8 Phase 5.1).
//
// The modular build reproduces the bundle's cascade-layer assignment by hand.
// That is the only thing that could differ, and it is invisible in a diff of
// the CSS — it only shows up in what the browser actually computes. So this
// loads a running page under each build and compares the resolved values of
// every property the design system sets on the components we ship.
//
// Usage — with `npm run dev` already running:
//
//   node scripts/compare-vendor-css.mjs --url http://localhost:3000
//
// Regenerates `vendor/slds2.css` twice and leaves it on the default mode.

import { execFileSync } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { chromium } from "playwright";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");

const urlArg = process.argv.indexOf("--url");
const URL_ = urlArg === -1 ? "http://localhost:3000" : process.argv[urlArg + 1];

/** Everything the design system sets that a layer mistake could change. */
const PROPS = [
  "color", "background-color", "border-radius", "border-width", "border-color",
  "border-style", "box-shadow", "font-size", "font-weight", "font-family",
  "line-height", "padding", "margin", "display", "fill", "gap", "opacity",
  "text-decoration-line", "text-transform", "letter-spacing", "min-height",
  "align-items", "justify-content", "position", "overflow",
];

/** One element per component we ship, plus the layout primitives. */
const TARGETS = {
  "button brand": ".slds-button_brand",
  "button neutral": ".slds-button_neutral",
  card: ".slds-card",
  "card header": ".slds-card__header",
  "card body": ".slds-card__body",
  "card footer": ".slds-card__footer",
  badge: ".slds-badge",
  "progress bar": ".slds-progress-bar",
  "progress bar value": ".slds-progress-bar__value",
  "progress marker": ".slds-progress__marker",
  "path item": ".slds-path__item",
  "path link": ".slds-path__link",
  "path title": ".slds-path__title",
  avatar: ".slds-avatar",
  "avatar initials": ".slds-avatar__initials",
  tile: ".slds-tile",
  box: ".slds-box",
  "media figure": ".slds-media__figure",
  "heading large": ".slds-text-heading_large",
  "title caps": ".slds-text-title_caps",
  "body small": ".slds-text-body_small",
  "dotted list item": ".slds-list_dotted .slds-list__item",
  icon: ".slds-icon",
  "icon container": ".slds-icon_container",
  link: "main a:not(.slds-button)",
  h1: "h1",
  "grid col": ".slds-col",
  "container x-large": ".slds-container_x-large",
};

function build(mode) {
  execFileSync("node", [resolve(here, "build-vendor-css.mjs"), `--mode=${mode}`], {
    cwd: root,
    stdio: "inherit",
  });
}

async function snapshot(page, scheme) {
  await page.evaluate((s) => {
    const root = document.documentElement;
    root.classList.remove(
      "slds-color-scheme_light",
      "slds-color-scheme_dark",
      "slds-color-scheme_system",
    );
    root.classList.add(`slds-color-scheme_${s}`);
  }, scheme);

  return page.evaluate(
    ({ targets, props }) => {
      const out = {};
      for (const [name, selector] of Object.entries(targets)) {
        const el = document.querySelector(selector);
        if (!el) {
          out[name] = "MISSING";
          continue;
        }
        const cs = getComputedStyle(el);
        out[name] = Object.fromEntries(props.map((p) => [p, cs.getPropertyValue(p)]));
      }
      return out;
    },
    { targets: TARGETS, props: PROPS },
  );
}

async function capture(browser, mode) {
  build(mode);
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  // Give the dev server time to notice the stylesheet changed.
  await page.goto(URL_, { waitUntil: "networkidle" });
  await sleep(500);

  const result = {};
  for (const scheme of ["light", "dark"]) {
    result[scheme] = await snapshot(page, scheme);
  }
  await page.close();
  return result;
}

function diff(a, b) {
  const rows = [];
  for (const scheme of Object.keys(a)) {
    for (const name of Object.keys(a[scheme])) {
      const left = a[scheme][name];
      const right = b[scheme][name];
      if (left === "MISSING" || right === "MISSING") {
        if (left !== right) rows.push(`${scheme} · ${name}: present in one build only`);
        continue;
      }
      for (const prop of Object.keys(left)) {
        if (left[prop] !== right[prop]) {
          rows.push(`${scheme} · ${name} · ${prop}: bundled "${left[prop]}" vs modular "${right[prop]}"`);
        }
      }
    }
  }
  return rows;
}

const browser = await chromium.launch();
try {
  const bundled = await capture(browser, "bundled");
  const modular = await capture(browser, "modular");
  const rows = diff(bundled, modular);

  const checked = Object.keys(TARGETS).length * PROPS.length * 2;
  if (rows.length === 0) {
    console.log(`\nidentical — ${checked} computed values match across both schemes.`);
  } else {
    console.log(`\n${rows.length} difference(s) out of ${checked} computed values:\n`);
    for (const row of rows) console.log(`  ${row}`);
    // A parity *check* that always exits 0 is not a check: any wrapper keying
    // on the exit code would read a real cascade divergence as green.
    process.exitCode = 1;
  }
} finally {
  await browser.close();
  // Leave the working tree on whichever build the site ships, not on whichever
  // one this script happened to render last.
  execFileSync("node", [resolve(here, "build-vendor-css.mjs")], { cwd: root, stdio: "inherit" });
}
