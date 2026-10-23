import type { Metadata, Viewport } from "next";
import { SudokuGame } from "@/components/sudoku/sudoku-game";
import { EMBLEM_STYLE, LOOK_SCRIPT } from "@/components/sudoku/storage";
// The browser defaults the game was built on, in place of Carbon's reset (ADR-019).
import "@/components/games/base.css";
import "@/components/sudoku/sudoku.css";
// Every theme's tokens and scene styles, after the base so a theme's tokens win. Keep in step
// with SKINS (components/sudoku/themes/index.ts).
import "@/components/sudoku/themes/aurora/aurora.css";
import "@/components/sudoku/themes/candy/candy.css";
import "@/components/sudoku/themes/beach/beach.css";
import "@/components/sudoku/themes/halloween/halloween.css";
import "@/components/sudoku/themes/snow/snow.css";
import "@/components/sudoku/themes/blossom/blossom.css";

// Sudoku, built for a phone held upright, with its own look (its own themes, each in light and
// dark, not the studio site's Carbon tokens; DECISIONS.md ADR-019). Linked from the home page
// (ADR-020), but not in the nav or sitemap.ts, and noindex.
export const metadata: Metadata = {
  title: "Sudoku",
  description: "A calm, colourful Sudoku for your phone, lit by an aurora.",
  robots: { index: false, follow: false },
  // Add to Home Screen opens it full screen, like an app. Next writes the standard
  // mobile-web-app-capable; older iOS only reads the apple- prefixed one.
  appleWebApp: { capable: true, title: "Sudoku", statusBarStyle: "default" },
  other: { "apple-mobile-web-app-capable": "yes" },
};

/** viewport-fit=cover, so the safe-area insets keep the pad clear of the iPhone home bar. */
export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f1ff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0820" },
  ],
};

export default function Page() {
  return (
    <div className="sdk-shell">
      {/* The saved appearance and theme (or the season's), applied before the first paint. */}
      <script dangerouslySetInnerHTML={{ __html: LOOK_SCRIPT }} />
      <style dangerouslySetInnerHTML={{ __html: EMBLEM_STYLE }} />
      <SudokuGame />
    </div>
  );
}
