// Rasterize the 52 card faces Solitaire (/games/solitaire) shows from Byron Knoll's Vector Playing Cards
// (released into the public domain; github.com/notpeter/Vector-Playing-Cards keeps them). The court
// cards' SVGs run to 400–600 KB each, so each face is rendered once here to a 320 px wide WebP
// (sharp, oversampled then scaled down with Lanczos, the rounded corners kept transparent) in
// public/solitaire/cards/v1/, plus the home-screen icon (app/games/solitaire/apple-icon.png). All outputs
// are committed, so builds never need the pack. Bump the v1 folder (and CARD_DIR in
// components/solitaire/card.tsx) when the art changes: the files are served as immutable.
//
// Usage: npm run solitaire:cards
//   CARDS_SVG_DIR overrides the pack's cards-svg folder (default ../Vector-Playing-Cards/cards-svg).

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { CARDS, cardCode } from "../lib/solitaire/cards";

const SRC = process.env.CARDS_SVG_DIR ?? path.resolve("../Vector-Playing-Cards/cards-svg");
const OUT = "public/solitaire/cards/v1";
const ICON = "app/games/solitaire/apple-icon.png";
export const CARD_PX = 320;
/** Renders the 167.09 pt wide art at about 668 px, so the Lanczos step down to 320 px has detail to keep. */
const DENSITY = 144;

/** The pack's file for a card: tens are "10S", every other rank its letter or digit. */
function source(code: string): string {
  const name = code.startsWith("T") ? `10${code[1]}` : code;
  const file = path.join(SRC, `${name}.svg`);
  if (!fs.existsSync(file)) throw new Error(`Missing ${file} (set CARDS_SVG_DIR to the pack's cards-svg folder)`);
  return file;
}

async function face(code: string): Promise<Buffer> {
  return sharp(source(code), { density: DENSITY })
    .resize({ width: CARD_PX, kernel: "lanczos3" })
    .webp({ quality: 82, alphaQuality: 90, effort: 6 })
    .toBuffer();
}

/** 180×180, opaque: felt, a lattice back, and the ace of spades fanned over it. */
async function icon(): Promise<Buffer> {
  const ace = await sharp(source("AS"), { density: DENSITY }).resize({ width: 92 }).png().toBuffer();
  const back = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="92" height="134" viewBox="0 0 92 134">
      <defs><pattern id="l" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="7" height="7" fill="#c8102e"/><path d="M0 0H7M0 0V7" stroke="#f6d7d0" stroke-width="1.2"/></pattern></defs>
      <rect x="0.5" y="0.5" width="91" height="133" rx="7" fill="#fff" stroke="#9a9a9a"/>
      <rect x="6" y="6" width="80" height="122" rx="3" fill="url(#l)"/>
    </svg>`,
  );
  const felt = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180">
      <defs><radialGradient id="g" cx="50%" cy="40%" r="75%"><stop offset="0" stop-color="#2a8a3a"/><stop offset="1" stop-color="#14571f"/></radialGradient></defs>
      <rect width="180" height="180" fill="url(#g)"/>
    </svg>`,
  );
  const tilt = async (img: Buffer, deg: number) =>
    sharp(img).rotate(deg, { background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  const fanned = await sharp(felt)
    .composite([
      { input: await tilt(await sharp(back).png().toBuffer(), -12), left: 22, top: 18 },
      { input: await tilt(ace, 10), left: 58, top: 20 },
    ])
    .png()
    .toBuffer();
  // sharp composites last in a pipeline, so the alpha comes off in a second pass.
  return sharp(fanned).removeAlpha().png().toBuffer();
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  let total = 0;
  for (const card of CARDS) {
    const code = cardCode(card);
    const buf = await face(code);
    fs.writeFileSync(path.join(OUT, `${code}.webp`), buf);
    total += buf.length;
  }
  fs.mkdirSync(path.dirname(ICON), { recursive: true });
  fs.writeFileSync(ICON, await icon());
  console.log(`52 faces → ${OUT} (${(total / 1024).toFixed(0)} KB), icon → ${ICON}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
