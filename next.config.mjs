/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  // Solitaire lives at /solitaire; /Solitaire (any casing) is served the same page. Not a redirect:
  // custom routes match case-insensitively, so one from /Solitaire would also catch /solitaire and
  // loop, while a rewrite (checked after the filesystem) only sees paths no page answers.
  async rewrites() {
    return [{ source: "/Solitaire", destination: "/solitaire" }];
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
