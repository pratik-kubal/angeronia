/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
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
