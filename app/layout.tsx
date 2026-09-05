import type React from "react";
import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/site/theme-provider";
import { SkipLink } from "@/components/site/skip-link";
import { BRAND, LINKS, SITE_URL } from "@/data/angeronia";
import "./slds.css";

const siteUrl = SITE_URL;

// IBM Plex, self-hosted by next/font — no request reaches Google at runtime,
// and the generated size-adjusted fallback keeps the swap from shifting layout.
// The two CSS variables are consumed in `app/theme.angeronia.css` block C and
// nowhere else (D11, design rule 5).
const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  variable: "--font-plex-sans",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-plex-mono",
  display: "swap",
});

const description =
  "Angeronia Labs is a boutique software engineering studio in Philadelphia. We turn ambiguous problems into shipped, tested, owned software — AI/LLM product engineering, cloud microservices, and full-stack builds. Makers of Code Socratic.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Angeronia Labs — Software Engineering Studio",
    template: "%s | Angeronia Labs",
  },
  description,
  keywords: [
    "Angeronia Labs",
    "software engineering consultancy",
    "Philadelphia software studio",
    "AI engineering",
    "LLM product engineering",
    "AWS microservices",
    "Next.js consultancy",
    "Code Socratic",
    "FinTech engineering",
  ],
  authors: [{ name: BRAND.legal, url: siteUrl }],
  creator: BRAND.legal,
  openGraph: {
    type: "website",
    url: siteUrl,
    title: "Angeronia Labs — Software Engineering Studio",
    description,
    siteName: BRAND.name,
    images: [{ url: "/angeronia-logo-light.png", width: 500, height: 500, alt: BRAND.name }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Angeronia Labs — Software Engineering Studio",
    description,
    images: ["/angeronia-logo-light.png"],
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
  description,
  areaServed: "Worldwide",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Philadelphia",
    addressRegion: "PA",
    addressCountry: "US",
  },
  founder: {
    "@type": "Person",
    name: "Pratik Kubal",
    url: LINKS.linkedin,
  },
  knowsAbout: [
    "AI/LLM product engineering",
    "AWS microservices",
    "Next.js",
    "FinTech",
    "DevOps",
    "Cloud architecture",
  ],
  makesOffer: {
    "@type": "Offer",
    itemOffered: {
      "@type": "SoftwareApplication",
      name: "Code Socratic",
      applicationCategory: "EducationalApplication",
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
    <html
      lang="en"
      suppressHydrationWarning
      className={`${plexSans.variable} ${plexMono.variable}`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <ThemeProvider>
          <SkipLink />
          <div className="site-root">{children}</div>
        </ThemeProvider>
      </body>
    </html>
  );
}
