import type { MetadataRoute } from "next";
import { SITE_URL } from "@/data/angeronia";

/** One page, for now. Add routes here as they land. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
