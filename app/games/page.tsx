import type { Metadata, Viewport } from "next";
import { games } from "@/data/angeronia";
// The browser defaults the games were built on (ADR-019).
import "@/components/games/base.css";
import "@/components/games/launcher.css";

// The games launcher (DECISIONS.md ADR-021): the games' icons and names and nothing else, meant
// to be saved to an iPhone's home screen from Safari or Chrome. It opens full screen as "Games"
// and every game opens inside it; each game links back here. Games-side, like the games: its own
// look, noindex, and not in sitemap.ts. Its home-screen icon, app/games/apple-icon.png, is made
// by `npm run games:icon`.
const title = "Games";
const description = "Sudoku, Solitaire, Color Tap and whatever comes next, in one place.";
const icon = { url: "/games/apple-icon.png", width: 180, height: 180, alt: "" };

export const metadata: Metadata = {
  title,
  description,
  robots: { index: false, follow: false },
  // A shared link previews as this page, with its own icon, not as the studio site that the
  // root layout describes (its title, its pitch and its social image would otherwise apply).
  openGraph: { type: "website", url: "/games", title, description, images: [icon] },
  twitter: { card: "summary", title, description, images: [icon] },
  // Add to Home Screen opens it full screen, like an app. The default status bar keeps every
  // page below the clock, tinted by its own theme-color (ADR-021).
  appleWebApp: { capable: true, title: "Games", statusBarStyle: "default" },
  other: { "apple-mobile-web-app-capable": "yes" },
};

/** viewport-fit=cover, so the safe-area insets keep the icons clear of the notch and home bar. */
export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f2f7" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function Page() {
  return (
    <main id="main" className="gml-shell">
      <h1 className="gml-sr">Games</h1>
      <ul className="gml-grid">
        {games.map((game) => (
          <li key={game.href}>
            {/* A full page load, not a client-side hop: each game brings its own stylesheet. */}
            <a className="gml-app" href={game.href}>
              {/* eslint-disable-next-line @next/next/no-img-element -- images are unoptimized
                  site-wide, and the icons are already 180 × 180. The name below says it. */}
              <img className="gml-icon" src={game.icon} alt="" width={180} height={180} />
              <span className="gml-name">{game.name}</span>
            </a>
          </li>
        ))}
      </ul>
    </main>
  );
}
