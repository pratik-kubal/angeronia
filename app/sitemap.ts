import type { MetadataRoute } from "next";
import { SITE_URL, legalDocuments } from "@/data/angeronia";

/** The home page, plus one entry per legal document. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
    ...legalDocuments.map((doc) => ({
      url: `${SITE_URL}/${doc.slug}`,
      lastModified: new Date(doc.updatedIso),
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
  ];
}
