import type React from "react";
import type { Metadata } from "next";
import { fontVariables } from "@/app/fonts";
import { SkipLink } from "@/components/site/skip-link";
import { BRAND, LINKS, SITE_URL, site } from "@/data/angeronia";
// The only two global stylesheets (DESIGN-RULES.md §1): tokens, then base.
import "@/styles/tokens.css";
import "@/styles/base.css";
import styles from "./layout.module.css";

const siteUrl = SITE_URL;

/**
 * Marks the page as scripted before it paints, so motion styles can key off
 * `html.js` and the page without script stays the finished page (ADR-025).
 */
const SCRIPTED = 'document.documentElement.classList.add("js")';

/**
 * The words come from data/angeronia.ts (`site`), in the third person
 * (ADR-028). The social image is app/opengraph-image.tsx (and
 * twitter-image.tsx), which Next adds to this metadata itself (ADR-026).
 */
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: site.title,
    template: site.titleTemplate,
  },
  description: site.description,
  keywords: [...site.keywords],
  authors: [{ name: BRAND.legal, url: siteUrl }],
  creator: BRAND.legal,
  openGraph: {
    type: "website",
    url: siteUrl,
    title: site.shareTitle,
    description: site.description,
    siteName: BRAND.name,
  },
  twitter: {
    card: "summary_large_image",
    title: site.shareTitle,
    description: site.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  alternates: { canonical: siteUrl },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: BRAND.legal,
  alternateName: BRAND.name,
  url: siteUrl,
  email: LINKS.email,
  description: site.structuredDescription,
  areaServed: site.structured.areaServed,
  address: {
    "@type": "PostalAddress",
    addressLocality: site.structured.address.locality,
    addressRegion: site.structured.address.region,
    addressCountry: site.structured.address.country,
  },
  founder: {
    "@type": "Person",
    name: site.founder,
    url: LINKS.linkedin,
  },
  knowsAbout: [...site.structured.knowsAbout],
  makesOffer: {
    "@type": "Offer",
    itemOffered: {
      "@type": "SoftwareApplication",
      name: site.product,
      applicationCategory: site.structured.productCategory,
      url: LINKS.codeSocratic,
    },
  },
  sameAs: [LINKS.linkedin, LINKS.github],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning: SCRIPTED adds a class to <html> before React
    // hydrates it. It covers this element's attributes only.
    <html lang="en" className={fontVariables} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCRIPTED }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <SkipLink />
        <div className={styles.page}>{children}</div>
      </body>
    </html>
  );
}
