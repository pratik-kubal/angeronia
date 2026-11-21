import type React from "react";
import type { Metadata } from "next";
import { Albert_Sans, Imbue } from "next/font/google";
import { SkipLink } from "@/components/site/skip-link";
import { BRAND, LINKS, SITE_URL, product, seo } from "@/data/angeronia";
import "@/styles/tokens.css";
import "@/styles/base.css";
import "@/styles/motion.css";

// Self-hosted by next/font: no request reaches Google at runtime. The two CSS
// variables are read by styles/tokens.css and nowhere else.
const display = Imbue({
  subsets: ["latin"],
  axes: ["opsz"],
  variable: "--font-display",
  display: "swap",
});

const text = Albert_Sans({
  subsets: ["latin"],
  variable: "--font-text",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: seo.title, template: `%s | ${BRAND.name}` },
  description: seo.description,
  authors: [{ name: BRAND.legal, url: SITE_URL }],
  creator: BRAND.legal,
  openGraph: {
    type: "website",
    url: SITE_URL,
    title: seo.ogTitle,
    description: seo.ogDescription,
    siteName: BRAND.name,
  },
  twitter: {
    card: "summary_large_image",
    title: seo.ogTitle,
    description: seo.ogDescription,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  alternates: { canonical: SITE_URL },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: BRAND.legal,
  alternateName: BRAND.name,
  url: SITE_URL,
  email: LINKS.email,
  description: seo.description,
  areaServed: "Worldwide",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Philadelphia",
    addressRegion: "PA",
    addressCountry: "US",
  },
  founder: { "@type": "Person", name: BRAND.founder, url: LINKS.linkedin },
  knowsAbout: ["AI agents", "Claude API", "LLM evaluation", "Agent cost modelling"],
  makesOffer: {
    "@type": "Offer",
    itemOffered: {
      "@type": "SoftwareApplication",
      name: product.name,
      applicationCategory: "EducationalApplication",
      url: LINKS.codeSocratic,
    },
  },
  sameAs: [LINKS.linkedin, LINKS.github],
};

// Motion is gated on this class. If the page's scripts never run, it comes off
// again, so nothing can stay hidden (design.md §6.1).
const GATE = `document.documentElement.classList.add("js");setTimeout(function(){if(!window.__angReady)document.documentElement.classList.remove("js")},3000);`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${display.variable} ${text.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: GATE }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <SkipLink />
        <div className="site-root">{children}</div>
      </body>
    </html>
  );
}
