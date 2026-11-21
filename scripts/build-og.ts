// Photographs the first screen at 1200 x 630 for link previews.
//   npm run build && npx next start -p 3417      (in another shell)
//   npm run build:og
import { chromium } from "playwright";
import { copyFileSync, writeFileSync } from "node:fs";
import { seo } from "../data/angeronia";

const PORT = Number(process.env.OG_PORT ?? 3417);

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  // The preview shows the name and the sentence. The navigation and the
  // button are controls, and a picture of a control is a lie.
  await page.addStyleTag({ content: "header, main > section:first-child a { visibility: hidden !important; }" });
  await page.waitForTimeout(500);
  await page.screenshot({ path: "app/opengraph-image.png", clip: { x: 0, y: 0, width: 1200, height: 630 } });
  await browser.close();
  copyFileSync("app/opengraph-image.png", "app/twitter-image.png");
  writeFileSync("app/opengraph-image.alt.txt", seo.ogImageAlt + "\n");
  writeFileSync("app/twitter-image.alt.txt", seo.ogImageAlt + "\n");
  console.log("wrote app/opengraph-image.png and app/twitter-image.png");
}

main();
