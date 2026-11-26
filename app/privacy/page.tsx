import type { Metadata } from "next";
import { LegalPage, legalMetadata } from "@/components/site/legal-page";
import { privacyPolicy } from "@/data/angeronia";

export const metadata: Metadata = legalMetadata(privacyPolicy);

export default function Privacy() {
  return <LegalPage document={privacyPolicy} />;
}
