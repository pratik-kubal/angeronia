import fs from "node:fs";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { games } from "../data/angeronia";

// The /games launcher (DECISIONS.md ADR-021): every game in the list lives under /games and ships
// the 180 × 180 icon both launchers show, and the launcher's own icon (`npm run games:icon`) is
// there and opaque, as a home-screen icon has to be.

describe("Games launcher", () => {
  it.each(games.map((g) => [g.name, g] as const))("%s lives under /games with its icon", async (_, game) => {
    expect(game.href).toMatch(/^\/games\/[a-z0-9-]+$/);
    expect(game.icon).toBe(`${game.href}/apple-icon.png`);
    const file = `app${game.icon}`;
    expect(fs.existsSync(`app${game.href}/page.tsx`)).toBe(true);
    const meta = await sharp(file).metadata();
    expect([meta.width, meta.height]).toEqual([180, 180]);
  });

  it("has an opaque 180 × 180 home-screen icon of its own", async () => {
    const meta = await sharp("app/games/apple-icon.png").metadata();
    expect([meta.width, meta.height]).toEqual([180, 180]);
    expect(meta.hasAlpha).toBe(false);
  });
});
