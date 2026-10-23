import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// The board's hairlines: a repeating gradient repeats at its last stop, so a period that ends past
// the ninth stretches every period, and the lines drift off the cell edges row by row (by the last
// row, over the selected pill's top border).

const CSS = readFileSync(join(__dirname, "sudoku.css"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");

/** The body of the rule whose selector is exactly `selector`. */
function body(selector: string): string {
  const at = CSS.indexOf(`${selector} {`);
  expect(at, selector).toBeGreaterThanOrEqual(0);
  const open = CSS.indexOf("{", at);
  return CSS.slice(open + 1, CSS.indexOf("}", open));
}

/** Every `name(...)` call in `css`, its arguments split on top-level commas (nested calls kept whole). */
function calls(css: string, name: string): string[][] {
  const found: string[][] = [];
  for (let at = css.indexOf(`${name}(`); at >= 0; at = css.indexOf(`${name}(`, at + 1)) {
    const args: string[] = [];
    let depth = 0;
    let arg = "";
    for (let i = at + name.length; i < css.length; i++) {
      const ch = css[i];
      if (ch === "(" && depth++ === 0) continue;
      if (ch === ")" && --depth === 0) break;
      if (ch === "," && depth === 1) {
        args.push(arg.trim());
        arg = "";
      } else arg += ch;
    }
    found.push([...args, arg.trim()]);
  }
  return found;
}

describe("the board's hairlines", () => {
  const hairlines = calls(body(".sdk-lines"), "repeating-linear-gradient");

  it("are drawn across and down", () => {
    expect(hairlines.map(([direction]) => direction)).toEqual(["to right", "to bottom"]);
  });

  it.each([0, 1])("repeat exactly every ninth (gradient %i)", (k) => {
    const stops = hairlines[k].slice(1);
    expect(stops.at(-1)).toBe("var(--line) 0 calc(100% / 9)");
  });

  it.each([0, 1])("straddle each cell edge, half a line either side (gradient %i)", (k) => {
    const stops = hairlines[k].slice(1);
    expect(stops[0]).toBe("var(--line) 0 0.5px");
    expect(stops[1]).toBe("transparent 0 calc(100% / 9 - 0.5px)");
  });
});
