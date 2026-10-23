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
    ];
  },
  experimental: {
    // Both Carbon packages are barrels — ~5,000 icons and ~200 components — and
    // a page that uses five of each should not ship either whole.
    optimizePackageImports: ["@carbon/icons-react", "@carbon/react"],
  },
  // Carbon is authored in Sass (styles/globals.scss). sass-embedded compiles the
  // whole design system in well under a second; `quietDeps` mutes deprecation
  // chatter from inside node_modules, which we cannot act on.
  sassOptions: { implementation: "sass-embedded", quietDeps: true },
};

export default nextConfig;
