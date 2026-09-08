// A small, dependency-free reader for SLDS 2's token CSS.
//
// Enough of a CSS custom-property engine to answer "what colour does
// `--slds-g-color-accent-2` actually resolve to, in dark mode, with the
// Angeronia theme layer applied?" — which is what `check-theme.mjs` needs and
// what a browser would otherwise have to tell us.
//
// Handles: `--name: value;` declarations (including multi-line values),
// `var(--x)` and `var(--x, fallback)`, and `light-dark(a, b)`. That is the
// entire vocabulary Cosmos uses for colour.

import { readFileSync } from "node:fs";

/**
 * Parse every custom-property declaration in a CSS string, last-wins.
 * Comments are stripped first so a commented-out declaration is not read.
 */
export function parseDeclarations(css) {
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const out = new Map();
  const re = /(--[a-zA-Z0-9-]+)\s*:\s*([^;{}]+);/g;
  let m;
  while ((m = re.exec(clean))) out.set(m[1], m[2].trim().replace(/\s+/g, " "));
  return out;
}

/** Same, but from a file path. */
export function parseFile(path) {
  return parseDeclarations(readFileSync(path, "utf8"));
}

/** Merge declaration maps left to right; later maps win. */
export function merge(...maps) {
  const out = new Map();
  for (const m of maps) for (const [k, v] of m) out.set(k, v);
  return out;
}

/** Split a comma-separated argument list, respecting nested parentheses. */
export function splitArgs(input) {
  const args = [];
  let depth = 0;
  let current = "";
  for (const ch of input) {
    if (ch === "(") depth++;
    else if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      args.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  if (current.trim()) args.push(current.trim());
  return args;
}

/** Find the argument list of the first `name(` call in `input`, or null. */
function callArgs(input, name) {
  const start = input.indexOf(name + "(");
  if (start === -1) return null;
  let depth = 0;
  for (let i = start + name.length; i < input.length; i++) {
    if (input[i] === "(") depth++;
    else if (input[i] === ")") {
      depth--;
      if (depth === 0) {
        return {
          before: input.slice(0, start),
          args: splitArgs(input.slice(start + name.length + 1, i)),
          after: input.slice(i + 1),
        };
      }
    }
  }
  return null;
}

/**
 * Resolve a declaration value to a concrete colour string.
 *
 * @param {string} value    the raw declaration value
 * @param {Map} tokens      merged declaration map
 * @param {"light"|"dark"} scheme
 */
export function resolveValue(value, tokens, scheme, seen = new Set()) {
  let out = String(value).trim();

  for (let guard = 0; guard < 64; guard++) {
    const ld = callArgs(out, "light-dark");
    if (ld) {
      out = ld.before + (scheme === "dark" ? ld.args[1] : ld.args[0]) + ld.after;
      continue;
    }
    const v = callArgs(out, "var");
    if (v) {
      const name = v.args[0];
      const fallback = v.args.slice(1).join(", ");
      if (seen.has(name)) throw new Error(`circular custom property: ${name}`);
      const referenced = tokens.get(name);
      if (referenced === undefined && !fallback) {
        throw new Error(`undefined custom property: ${name}`);
      }
      const next = new Set(seen).add(name);
      const replacement =
        referenced === undefined
          ? fallback
          : resolveValue(referenced, tokens, scheme, next);
      out = v.before + replacement + v.after;
      continue;
    }
    break;
  }
  return out.trim();
}

/** Resolve a hook by name. Throws if it is not defined anywhere. */
export function resolveHook(name, tokens, scheme) {
  const raw = tokens.get(name);
  if (raw === undefined) throw new Error(`undefined custom property: ${name}`);
  return resolveValue(raw, tokens, scheme, new Set([name]));
}
