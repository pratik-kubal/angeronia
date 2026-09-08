import type { Metadata } from "next";
import { LegalPage } from "@/components/site/legal-page";
import { privacyPolicy } from "@/data/angeronia";

export const metadata: Metadata = {
  title: privacyPolicy.title,
  description: privacyPolicy.lede,
  alternates: { canonical: `/${privacyPolicy.slug}` },
};

export default function Privacy() {
  return <LegalPage document={privacyPolicy} />;
}
