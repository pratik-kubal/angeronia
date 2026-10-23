import type { Metadata, Viewport } from "next";
import { SolitaireGame } from "@/components/solitaire/solitaire-game";
import "@/components/solitaire/solitaire.css";

// Solitaire (Klondike, turn three) on green felt, dealt only from deals proven winnable, for a
// phone on its side first and upright too. Served at /solitaire and, through a rewrite in
// next.config.mjs, at /Solitaire. Unlisted for now: not in the nav, not in sitemap.ts, and noindex.
export const metadata: Metadata = {
  title: "Solitaire",
  description: "Klondike, turn three, on green felt. Every deal can be won.",
  robots: { index: false, follow: false },
  // Add to Home Screen opens it full screen, like an app (Chrome on iOS offers it too).
  appleWebApp: { capable: true, title: "Solitaire", statusBarStyle: "black-translucent" },
  other: { "apple-mobile-web-app-capable": "yes" },
};

/** viewport-fit=cover: the felt runs under the notch and the home bar, the cards stay clear of both. */
export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: "#145a22",
};

/** The suits, drawn once and used by every slot and big corner index (text suits can turn into emoji on iOS). */
function SuitSymbols() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
      <symbol id="sol-suit-0" viewBox="0 0 24 24">
        <path d="M12 21.4 10.6 20C5.4 15.4 2 12.3 2 8.5 2 5.4 4.4 3 7.5 3c1.7 0 3.4.8 4.5 2.1C13.1 3.8 14.8 3 16.5 3 19.6 3 22 5.4 22 8.5c0 3.8-3.4 6.9-8.6 11.5L12 21.4z" />
      </symbol>
      <symbol id="sol-suit-1" viewBox="0 0 24 24">
        <path d="M12 2C9 6 3 9.5 3 14a4.5 4.5 0 0 0 7.6 3.3C10.2 19.4 9.3 21 8 22h8c-1.3-1-2.2-2.6-2.6-4.7A4.5 4.5 0 0 0 21 14c0-4.5-6-8-9-12z" />
      </symbol>
      <symbol id="sol-suit-2" viewBox="0 0 24 24">
        <path d="M12 2 20 12 12 22 4 12z" />
      </symbol>
      <symbol id="sol-suit-3" viewBox="0 0 24 24">
        <path d="M12 2.5a4.3 4.3 0 0 0-3.9 6.1A4.3 4.3 0 1 0 10.6 16c-.3 2.4-1.2 4.4-2.6 6h8c-1.4-1.6-2.3-3.6-2.6-6a4.3 4.3 0 1 0 2.5-7.4A4.3 4.3 0 0 0 12 2.5z" />
      </symbol>
    </svg>
  );
}

export default function Page() {
  return (
    <div className="sol-shell">
      <SuitSymbols />
      <SolitaireGame />
    </div>
  );
}
