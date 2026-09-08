// Resolve the site's design tokens the way a browser would, without a browser.
//
// Both the logo generator and the contrast gate need to answer "what colour is
// `--cds-link-primary` in the dark theme, with the Angeronia brand override
// applied?". The only honest source for that is the stylesheet the site
// actually ships, so this compiles `styles/globals.scss` and reads the custom
// properties back out of the emitted CSS. Nothing is duplicated in JavaScript,
// so the brand override cannot drift away from the thing being checked.
//
// Exports `themeTokens()`, which returns `{ light, dark }` — two maps of
// resolved `--cds-*` / `--site-*` values with every `var()` reference followed.

import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import * as sass from "sass-embedded";

const here = dirname(fileURLToPath(import.meta.url));
export const ROOT = resolve(here, "..");

/** Compile the production stylesheet. Roughly a second; nothing is cached. */
export function compileSiteCss() {
  return sass.compile(resolve(ROOT, "styles/globals.scss"), {
    loadPaths: [ROOT, resolve(ROOT, "node_modules")],
    quietDeps: true,
    style: "expanded",
  }).css;
}

/**
 * Every custom-property declaration in the top-level rules whose selector
 * matches `selectorRe`, in source order, last wins.
 *
 * Deliberately not a CSS parser: the only thing being read is a flat list of
 * `--name: value;` pairs out of two known rules, and a dependency that could
 * parse the whole of Carbon would be a much larger thing to trust. It does have
 * to track nesting, though — Carbon emits `:root[data-theme=dark]` a second
 * time inside a `forced-colors` media query, where `--cds-focus` is `Highlight`
 * rather than a colour, and a depth-blind scan would read that as the theme.
 */
function declarationsFor(css, selectorRe) {
  const out = new Map();
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, "");
  let depth = 0;
  let start = 0;
  let selector = null;

  for (let i = 0; i < clean.length; i += 1) {
    const ch = clean[i];
    if (ch === "{") {
      if (depth === 0) {
        const prelude = clean.slice(start, i).trim();
        selector = prelude.startsWith("@") ? null : prelude;
      }
      depth += 1;
    } else if (ch === "}") {
      depth -= 1;
      if (depth === 0) {
        if (selector !== null && selectorRe.test(selector)) {
          const decl = /(--[a-zA-Z0-9-]+)\s*:\s*([^;{}]+)[;}]/g;
          let d;
          while ((d = decl.exec(clean.slice(start, i)))) {
            out.set(d[1], d[2].trim().replace(/\s+/g, " "));
          }
        }
        selector = null;
        start = i + 1;
      }
    }
  }
  return out;
}

/** Follow `var(--x)` and `var(--x, fallback)` until a literal falls out. */
function resolveAll(map) {
  // `seen` is per token, not shared: two tokens may legitimately walk the same
  // edge, and a shared set would silently drop the second one to its fallback.
  const resolveOne = (name, seen, depth = 0) => {
    if (depth > 12) return map.get(name);
    const value = map.get(name);
    if (value === undefined) return undefined;
    return value.replace(/var\(\s*(--[a-zA-Z0-9-]+)\s*(?:,\s*([^)]*))?\)/g, (_, ref, fallback) => {
      if (seen.has(ref)) return fallback ?? "";
      seen.add(ref);
      return resolveOne(ref, seen, depth + 1) ?? fallback ?? "";
    });
  };
  const out = new Map();
  for (const name of map.keys()) out.set(name, resolveOne(name, new Set([name])));
  return out;
}

/**
 * `{ light, dark }` — the resolved token map for each theme.
 *
 * Light is every `:root` block; dark is those overlaid with
 * `:root[data-theme="dark"]`, which is exactly how the cascade composes them
 * in the browser.
 */
export function themeTokens(css = compileSiteCss()) {
  const light = declarationsFor(css, /^:root$/);
  const darkOverlay = declarationsFor(css, /^:root\[data-theme=["']?dark["']?\]$/);
  if (light.size === 0) throw new Error("No `:root` custom properties found in the compiled CSS.");
  if (darkOverlay.size === 0) {
    throw new Error("No `:root[data-theme=dark]` custom properties found in the compiled CSS.");
  }
  const dark = new Map(light);
  for (const [k, v] of darkOverlay) dark.set(k, v);
  return { light: resolveAll(light), dark: resolveAll(dark) };
}
