import { describe, expect, it } from "vitest";
import nextConfig from "./next.config.mjs";

describe("next.config", () => {
  it("serves /Solitaire with a rewrite, never a redirect (custom routes ignore case, so a redirect would loop)", async () => {
    const rewrites = await nextConfig.rewrites!();
    expect(rewrites).toEqual([{ source: "/Solitaire", destination: "/solitaire" }]);
    const redirects = (await nextConfig.redirects?.()) ?? [];
    expect(redirects.some((r) => /solitaire/i.test(r.source) || /solitaire/i.test(r.destination))).toBe(false);
  });

  it("caches the card faces for good (their folder is versioned)", async () => {
    const headers = await nextConfig.headers!();
    const rule = headers.find((h) => h.source === "/solitaire/cards/:path*");
    expect(rule?.headers).toContainEqual({ key: "Cache-Control", value: "public, max-age=31536000, immutable" });
  });
});
