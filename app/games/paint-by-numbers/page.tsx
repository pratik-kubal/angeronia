import type { Metadata, Viewport } from "next";
import { ColorTapGame } from "@/components/color-tap/color-tap-game";
// The browser defaults the game was built on, in place of Carbon's reset (ADR-019).
import "@/components/games/base.css";
import "@/components/color-tap/color-tap.css";

// Color Tap: paint by numbers, made from the photos in public/paint-by-numbers/ at build time
// (DECISIONS.md ADR-022), in a dark studio of its own (not the studio site's Carbon tokens;
// ADR-019). On the /games launcher and the home page's Games section (ADR-020, ADR-021), but not in
// the nav or sitemap.ts, and noindex.
export const metadata: Metadata = {
  title: "Color Tap",
  description: "Paint by numbers, one tap at a time.",
  robots: { index: false, follow: false },
  // Add to Home Screen opens it full screen, like an app. Next writes the standard
  // mobile-web-app-capable; older iOS only reads the apple- prefixed one.
  appleWebApp: { capable: true, title: "Color Tap", statusBarStyle: "default" },
  other: { "apple-mobile-web-app-capable": "yes" },
};

/** viewport-fit=cover, so the safe-area insets keep the paint box clear of the iPhone home bar. */
export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: "#121625",
};

export default function Page() {
  return (
    <div className="ctp-shell">
      <ColorTapGame />
    </div>
  );
}
