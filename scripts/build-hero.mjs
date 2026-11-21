// Makes the first-screen photograph's served sizes from the committed source.
//   npm run build:hero
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const SOURCE = "scripts/sources/hero-schuylkill-night.jpg"; // 4800 x 2630
const OUT = "public/hero";
// A phone shows a column of the same picture: the two tallest towers.
const COLUMN = { left: 1601, top: 0, width: 1215, height: 2630 };

mkdirSync(OUT, { recursive: true });

async function write(image, name) {
  await image.clone().avif({ quality: 55 }).toFile(`${OUT}/${name}.avif`);
  await image.clone().jpeg({ quality: 78, mozjpeg: true }).toFile(`${OUT}/${name}.jpg`);
}

for (const width of [1440, 2160, 2880]) {
  await write(sharp(SOURCE).resize({ width }), `schuylkill-${width}`);
}
for (const width of [780, 1170]) {
  await write(sharp(SOURCE).extract(COLUMN).resize({ width }), `schuylkill-portrait-${width}`);
}
console.log("hero photographs written to", OUT);
