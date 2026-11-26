import localFont from "next/font/local";

/**
 * The studio's two faces (DESIGN-RULES.md §5), from files in the repo
 * (`assets/fonts/`, each with its SIL Open Font License): neither the build nor
 * a visitor's browser asks Google for them (ADR-034). next/font serves them from
 * this domain and generates a size-adjusted fallback, so the swap does not shift
 * the layout.
 *
 * Each is exposed only as a CSS variable on <html> (`fontVariables`, applied by
 * app/layout.tsx and by .storybook/preview.tsx), and read only by `--font-sans`
 * and `--font-code` in styles/tokens.css.
 */

/**
 * Hanken Grotesk: 400 text, 500 buttons and names, 600 statements. One
 * variable file, the latin subset Google Fonts serves (its axis runs 100–900;
 * declared 400–600, the weights the site uses).
 */
export const hanken = localFont({
  src: "../assets/fonts/hanken-grotesk/hanken-grotesk-latin-wght.woff2",
  weight: "400 600",
  style: "normal",
  variable: "--font-hanken",
  display: "swap",
});

/** IBM Plex Mono 400, latin: code only, inside the Code.Socratic replica. */
export const plexMono = localFont({
  src: "../assets/fonts/ibm-plex-mono/ibm-plex-mono-latin-400.woff2",
  weight: "400",
  style: "normal",
  variable: "--font-plex-mono",
  display: "swap",
  // Code sits below the fold; it should not compete with the statements' face.
  preload: false,
});

/** Both variables, as one class list for <html>. */
export const fontVariables = `${hanken.variable} ${plexMono.variable}`;
