import { describe, expect, it } from "vitest";
import nextConfig from "./next.config.mjs";

describe("next.config", () => {
  it("serves /games/Solitaire with a rewrite, never a redirect (custom routes ignore case, so a redirect would loop)", async () => {
    const rewrites = await nextConfig.rewrites!();
    expect(rewrites).toEqual([{ source: "/games/Solitaire", destination: "/games/solitaire" }]);
    const redirects = (await nextConfig.redirects?.()) ?? [];
    expect(redirects.some((r) => /^\/games\/solitaire$/i.test(r.source))).toBe(false);
  });

  it("redirects the games' old paths to /games for good, and nothing under them", async () => {
    const redirects = (await nextConfig.redirects?.()) ?? [];
    expect(redirects).toEqual([
      { source: "/sudoku", destination: "/games/sudoku", permanent: true },
      { source: "/solitaire", destination: "/games/solitaire", permanent: true },
    ]);
  });

  it("caches the card faces for good (their folder is versioned)", async () => {
    const headers = await nextConfig.headers!();
    const rule = headers.find((h) => h.source === "/solitaire/cards/:path*");
    expect(rule?.headers).toContainEqual({ key: "Cache-Control", value: "public, max-age=31536000, immutable" });
  });
});
