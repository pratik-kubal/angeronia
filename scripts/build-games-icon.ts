// Makes the /games launcher's home-screen icon, app/games/apple-icon.png (180 × 180, opaque), from
// the games' own icons: up to four of them, small and rounded, on a dark ground, the way an iOS
// folder shows the apps inside it (DECISIONS.md ADR-021). The games come from `games` in
// data/angeronia.ts, in that order, and each icon from its route's apple-icon.png. Re-run it when a
// game is added; the output is committed.
//
// Usage: npm run games:icon

import fs from "node:fs";
import sharp from "sharp";
import { games } from "../data/angeronia";

const SIZE = 180;
const OUT = "app/games/apple-icon.png";
/** iOS's dark grouped ground, which every game's icon reads against. */
const GROUND = "#1c1c1e";
/** iOS rounds an icon to about 22.5% of its side. */
const ROUNDING = 0.225;
const GAP = 14;

/** One game alone sits large; two sit side by side; three or four make a 2 × 2. */
function layout(count: number): { size: number; cols: number; rows: number } {
  if (count === 1) return { size: 112, cols: 1, rows: 1 };
  if (count === 2) return { size: 70, cols: 2, rows: 1 };
  return { size: 64, cols: 2, rows: 2 };
}

/** A game's icon at `size`, its corners cut the way iOS cuts them. */
async function rounded(file: string, size: number): Promise<Buffer> {
  const r = Math.round(size * ROUNDING);
  const mask = Buffer.from(`<svg width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${r}" ry="${r}"/></svg>`);
  return sharp(file)
    .resize(size, size, { kernel: "lanczos3" })
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toBuffer();
}

async function main() {
  const shown = games.slice(0, 4);
  if (shown.length === 0) throw new Error("No games in data/angeronia.ts");
  const { size, cols, rows } = layout(shown.length);
  const left = Math.round((SIZE - (cols * size + (cols - 1) * GAP)) / 2);
  const top = Math.round((SIZE - (rows * size + (rows - 1) * GAP)) / 2);

  const tiles = await Promise.all(
    shown.map(async (game, i) => {
      const file = `app${game.href}/apple-icon.png`;
      if (!fs.existsSync(file)) throw new Error(`Missing ${file}: every game needs its apple-icon.png`);
      return {
        input: await rounded(file, size),
        left: left + (i % cols) * (size + GAP),
        top: top + Math.floor(i / cols) * (size + GAP),
      };
    }),
  );

  await sharp({ create: { width: SIZE, height: SIZE, channels: 3, background: GROUND } })
    .composite(tiles)
    // Opaque: iOS fills any transparency in a home-screen icon with black.
    .removeAlpha()
    .png({ compressionLevel: 9 })
    .toFile(OUT);
  console.log(`${shown.map((g) => g.name).join(", ")} → ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
