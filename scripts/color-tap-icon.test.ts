import fs from "node:fs";
import sharp from "sharp";
import { describe, expect, it } from "vitest";

// Color Tap's committed home-screen icon (npm run color-tap:icon, scripts/build-color-tap-icon.ts,
// DECISIONS.md ADR-022): it is the 180 × 180 PNG iOS asks for, opaque (iOS fills any transparency
// with black), and a picture rather than a flat tile; and it reads as a painting in progress, so it
// still has blank paper, the morpho's blue and painted leaves in it. It is not re-rendered here: the
// numbers are drawn with the system's fonts, so the bytes would differ from machine to machine.

const ICON = "app/games/paint-by-numbers/apple-icon.png";

/** The share of the icon's pixels for which `test(r, g, b)` holds. */
async function share(test: (r: number, g: number, b: number) => boolean): Promise<number> {
  const { data, info } = await sharp(ICON).raw().toBuffer({ resolveWithObject: true });
  let hits = 0;
  for (let i = 0; i < data.length; i += info.channels) if (test(data[i], data[i + 1], data[i + 2])) hits++;
  return hits / (info.width * info.height);
}

describe("Color Tap's home-screen icon", () => {
  it("is there, as a PNG", async () => {
    expect(fs.existsSync(ICON)).toBe(true);
    expect((await sharp(ICON).metadata()).format).toBe("png");
  });

  it("is 180 × 180", async () => {
    const meta = await sharp(ICON).metadata();
    expect([meta.width, meta.height]).toEqual([180, 180]);
  });

  it("has no alpha channel, so iOS has nothing to fill with black", async () => {
    const meta = await sharp(ICON).metadata();
    expect(meta.hasAlpha).toBe(false);
    expect(meta.channels).toBe(3);
  });

  it("is a picture, not one flat colour", async () => {
    const { channels } = await sharp(ICON).stats();
    for (const channel of channels) expect(channel.stdev).toBeGreaterThan(20);
  });

  it("is part blank paper and part painted, so it reads as a painting in progress", async () => {
    const paper = await share((r, g, b) => r > 235 && g > 235 && b > 235);
    expect(paper).toBeGreaterThan(0.1);
    expect(paper).toBeLessThan(0.6);
    expect(await share((r, g, b) => b > r + 60 && b > g + 30), "the butterfly's blue").toBeGreaterThan(0.03);
    expect(await share((r, g, b) => g > r + 20 && g > b + 20), "the leaves").toBeGreaterThan(0.1);
  });
});
