import { Hanken_Grotesk, IBM_Plex_Mono } from "next/font/google";

/**
 * The studio's two faces (DESIGN-RULES.md §5), self-hosted by next/font: no
 * request reaches Google at runtime, and the generated size-adjusted fallback
 * keeps the swap from shifting the layout.
 *
 * Each is exposed only as a CSS variable on <html> (`fontVariables`, applied by
 * app/layout.tsx and by .storybook/preview.tsx), and read only by `--font-sans`
 * and `--font-code` in styles/tokens.css.
 */

/** Hanken Grotesk: 400 text, 500 buttons and names, 600 statements. */
export const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-hanken",
  display: "swap",
});

/** IBM Plex Mono: code only, inside the Code.Socratic replica. */
export const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-plex-mono",
  display: "swap",
  // Code sits below the fold; it should not compete with the statements' face.
  preload: false,
});

/** Both variables, as one class list for <html>. */
export const fontVariables = `${hanken.variable} ${plexMono.variable}`;
