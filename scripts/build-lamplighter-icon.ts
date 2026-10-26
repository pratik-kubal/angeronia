// Draws Lamplighter's Add to Home Screen icon, app/games/lamplighter/apple-icon.png (180 × 180,
// opaque): a ribbon of moonlight across a night sky, and Wick's glow riding its crest. Drawn here
// as an SVG, so the game ships no third-party art (DECISIONS.md ADR-022). The output is committed;
// re-run `npm run games:icon` after it, since the launcher's icon is made from this one.
//
// Usage: npm run lamplighter:icon

import sharp from "sharp";

const SIZE = 180;
const OUT = "app/games/lamplighter/apple-icon.png";

const STARS: [number, number, number][] = [
  [22, 26, 1.3], [48, 14, 0.9], [74, 34, 1.1], [112, 18, 0.8], [150, 30, 1.4], [164, 62, 0.9],
  [16, 70, 0.8], [40, 52, 1], [130, 52, 0.7], [96, 60, 0.9], [60, 80, 0.7], [146, 96, 0.8],
];

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 180 180">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#070a24"/>
      <stop offset="0.6" stop-color="#121a4a"/>
      <stop offset="1" stop-color="#26306a"/>
    </linearGradient>
    <linearGradient id="ribbon" x1="0" y1="1" x2="1" y2="0">
      <stop offset="0" stop-color="#9fb6ff" stop-opacity="0.15"/>
      <stop offset="0.55" stop-color="#cfdcff" stop-opacity="0.85"/>
      <stop offset="1" stop-color="#eef3ff" stop-opacity="0.35"/>
    </linearGradient>
    <radialGradient id="halo">
      <stop offset="0" stop-color="#fff6c4" stop-opacity="1"/>
      <stop offset="0.18" stop-color="#ffe27a" stop-opacity="0.95"/>
      <stop offset="0.45" stop-color="#ffcf4a" stop-opacity="0.35"/>
      <stop offset="1" stop-color="#ffcf4a" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="moonGlow">
      <stop offset="0.5" stop-color="#f4f0dc" stop-opacity="0.25"/>
      <stop offset="1" stop-color="#f4f0dc" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="180" height="180" fill="url(#sky)"/>
  ${STARS.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#e8ecff" opacity="0.8"/>`).join("")}
  <circle cx="138" cy="40" r="26" fill="url(#moonGlow)"/>
  <path d="M138 24a16 16 0 1 0 12 26.5A13 13 0 1 1 138 24z" fill="#f4f0dc"/>
  <path d="M0 176 C 42 150, 70 96, 112 92 S 168 120, 180 104 L 180 126 C 166 140, 140 116, 112 116 S 52 170, 24 180 L 0 180 Z" fill="url(#ribbon)"/>
  <path d="M0 176 C 42 150, 70 96, 112 92 S 168 120, 180 104" fill="none" stroke="#eef3ff" stroke-width="1.6" stroke-opacity="0.7"/>
  <circle cx="102" cy="80" r="34" fill="url(#halo)"/>
  <ellipse cx="96" cy="76" rx="7" ry="4" fill="#e8ecff" opacity="0.55" transform="rotate(-25 96 76)"/>
  <ellipse cx="108" cy="76" rx="7" ry="4" fill="#e8ecff" opacity="0.55" transform="rotate(25 108 76)"/>
  <circle cx="102" cy="82" r="5.5" fill="#fffbe0"/>
</svg>`;

sharp(Buffer.from(svg))
  .resize(SIZE, SIZE)
  // Opaque: iOS fills any transparency in a home-screen icon with black.
  .removeAlpha()
  .png({ compressionLevel: 9 })
  .toFile(OUT)
  .then(() => console.log(`→ ${OUT}`))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
