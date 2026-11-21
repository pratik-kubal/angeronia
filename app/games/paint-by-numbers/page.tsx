import type { Metadata, Viewport } from "next";
import { ColorTapGame } from "@/components/color-tap/color-tap-game";
// The browser defaults the game was built on (ADR-019).
import "@/components/games/base.css";
import "@/components/color-tap/color-tap.css";

// Color Tap: paint by numbers, made from the photos in public/paint-by-numbers/ at build time
// (DECISIONS.md ADR-022), in a dark studio of its own (not the studio site's tokens; ADR-019).
// On the /games launcher (ADR-021); nothing on the studio site links to it (ADR-024), and it is
// not in sitemap.ts, and noindex.
const title = "Color Tap";
const description = "Paint by numbers, one tap at a time.";
const icon = { url: "/games/paint-by-numbers/apple-icon.png", width: 180, height: 180, alt: "" };

export const metadata: Metadata = {
  title,
  description,
  robots: { index: false, follow: false },
  // A shared link previews as this page, with its own icon, not as the studio site that the
  // root layout describes (its title, its pitch and its social image would otherwise apply).
  openGraph: { type: "website", url: "/games/paint-by-numbers", title, description, images: [icon] },
  twitter: { card: "summary", title, description, images: [icon] },
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
