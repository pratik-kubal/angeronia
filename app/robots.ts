import type { MetadataRoute } from "next";
import { SITE_URL } from "@/data/angeronia";

/** Nothing here is private, so everything is crawlable. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
