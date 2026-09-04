import type React from "react";
import type { Metadata } from "next";
import { Space_Grotesk, Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { BRAND, LINKS } from "@/data/angeronia";
import "./globals.css";

const siteUrl = "https://angeronia.com";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  weight: ["400", "500"],
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  weight: ["400", "500"],
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
      className={`${spaceGrotesk.variable} ${geist.variable} ${geistMono.variable}`}
    >
      <head>
        <style>{`
html { font-family: var(--font-geist), system-ui, sans-serif; }
        `}</style>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* Pre-paint motion gate: mark motion available only when reduced-motion
            is off AND JS runs. 3s failsafe reveals everything if an engine never
            loads. No-JS / reduced-motion never set data-motion, so the final,
            static state always shows. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(!matchMedia('(prefers-reduced-motion: reduce)').matches){document.documentElement.dataset.motion='on';setTimeout(function(){document.documentElement.removeAttribute('data-motion')},3000)}}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <ThemeProvider
          attribute={["class", "data-theme"]}
          themes={["light", "dark", "bw"]}
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <div className="relative z-10 min-h-screen flex flex-col">{children}</div>
        </ThemeProvider>
      </body>
    </html>
  );
}
