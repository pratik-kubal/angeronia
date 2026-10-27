import { describe, expect, it } from "vitest";
import { paletteOrder } from "./regions";

// The paint box's order: neutrals first, then by hue, with the colours merged away or lost to
// cleanup (NaN in the palette) left out, wherever they sit among the ones in use.

/** An OKLab colour of lightness L, chroma C and hue h (degrees). */
const lch = (L: number, C: number, h: number) => [L, C * Math.cos((h * Math.PI) / 180), C * Math.sin((h * Math.PI) / 180)];
const gone = [NaN, NaN, NaN];

describe("paletteOrder", () => {
  it("leaves out unused colours and keeps the rest in hue order, wherever the unused ones sit", () => {
    // Green (hue group 5) before an unused colour and orange (group 1): orange comes first.
    expect(paletteOrder(new Float64Array([...lch(0.6, 0.1, 150), ...gone, ...lch(0.6, 0.1, 40)]))).toEqual([2, 0]);
    expect(paletteOrder(new Float64Array([...gone, ...lch(0.6, 0.1, 150), ...lch(0.5, 0, 0), ...gone, ...lch(0.6, 0.1, 40), ...gone]))).toEqual([2, 4, 1]);
  });

  it("puts neutrals first and, within a hue, light before dark", () => {
    expect(paletteOrder(new Float64Array([...lch(0.4, 0.1, 40), ...lch(0.8, 0.1, 45), ...lch(0.3, 0.01, 200)]))).toEqual([2, 1, 0]);
  });
});
