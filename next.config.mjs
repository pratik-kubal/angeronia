/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  // The games live under /games (DECISIONS.md ADR-021). Their old paths redirect for good, so a
  // shared link or a game already saved to a home screen still opens; custom routes match
  // case-insensitively, so /solitaire covers /Solitaire. Exact paths only: the card faces stay
  // at /solitaire/cards/.
  async redirects() {
    return [
      { source: "/sudoku", destination: "/games/sudoku", permanent: true },
      { source: "/solitaire", destination: "/games/solitaire", permanent: true },
    ];
  },
  // /games/Solitaire (any casing) is served the same page. Not a redirect: one from
  // /games/Solitaire would also catch /games/solitaire and loop, while a rewrite (checked after
  // the filesystem) only sees paths no page answers.
  async rewrites() {
    return [{ source: "/games/Solitaire", destination: "/games/solitaire" }];
  },
  async headers() {
    return [
      {
        // The card faces never change under a name: a new art set gets a new folder (v2, …).
        source: "/solitaire/cards/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        // Color Tap's puzzles and thumbnails are named by a hash of what they hold (ADR-022).
        source: "/paint-by-numbers/puzzles/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
