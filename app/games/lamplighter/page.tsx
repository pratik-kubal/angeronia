import type { Metadata, Viewport } from "next";
import { LamplighterGame } from "@/components/lamplighter/lamplighter-game";
// The browser defaults the game was built on, in place of Carbon's reset (ADR-019).
import "@/components/games/base.css";
import "@/components/lamplighter/lamplighter.css";

// Lamplighter: Wick the firefly flies ribbons of moonlight over a sleeping town and lights its
// lanterns. Drawn in 3D on a 2D canvas, for a phone upright first (DECISIONS.md ADR-022). Listed by
// both games launchers, but not in the nav or sitemap.ts, and noindex.
export const metadata: Metadata = {
  title: "Lamplighter",
  description: "Fly a firefly along ribbons of moonlight and light the sleeping town's lanterns.",
  robots: { index: false, follow: false },
  // Add to Home Screen opens it full screen, like an app. Next writes the standard
  // mobile-web-app-capable; older iOS only reads the apple- prefixed one.
  appleWebApp: { capable: true, title: "Lamplighter", statusBarStyle: "default" },
  other: { "apple-mobile-web-app-capable": "yes" },
};

/** viewport-fit=cover: the night sky runs under the notch and the home bar, the controls stay clear of both. */
export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: "#0b1030",
};

export default function Page() {
  return (
    <div className="lmp-shell">
      <LamplighterGame />
    </div>
  );
}
