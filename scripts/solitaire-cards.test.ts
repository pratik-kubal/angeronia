import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { CARDS, cardCode } from "../lib/solitaire/cards";

// The committed output of `pnpm solitaire:cards` (scripts/build-solitaire-cards.ts): what
// components/solitaire/card.tsx loads and the win animations draw.

const DIR = "public/solitaire/cards/v1";
/** The art's own proportions (viewBox 167.09 × 242.67); layout.ts sizes cards by it. */
const ASPECT = 242.667 / 167.087;

describe("Solitaire card faces", () => {
  it("has a 320 px WebP per card, in the art's proportions", async () => {
    for (const card of CARDS) {
      const file = path.join(DIR, `${cardCode(card)}.webp`);
      expect(fs.existsSync(file), file).toBe(true);
      const meta = await sharp(file).metadata();
      expect(meta.format).toBe("webp");
      expect(meta.width).toBe(320);
      expect(Math.abs(meta.height! / meta.width! - ASPECT)).toBeLessThan(ASPECT * 0.01);
      expect(meta.hasAlpha, `${file} keeps its transparent corners`).toBe(true);
    }
  });

  it("stays light: at most 60 KB a face and 1.3 MB for the deck", () => {
    const sizes = CARDS.map((card) => fs.statSync(path.join(DIR, `${cardCode(card)}.webp`)).size);
    for (const size of sizes) expect(size).toBeLessThanOrEqual(60_000);
    expect(sizes.reduce((a, b) => a + b, 0)).toBeLessThanOrEqual(1_300_000);
  });

  it("ships nothing else in the folder", () => {
    expect(fs.readdirSync(DIR).sort()).toEqual(CARDS.map((c) => `${cardCode(c)}.webp`).sort());
  });

  it("has an opaque 180 × 180 home-screen icon", async () => {
    const meta = await sharp("app/solitaire/apple-icon.png").metadata();
    expect([meta.width, meta.height]).toEqual([180, 180]);
    expect(meta.hasAlpha).toBe(false);
  });
});
