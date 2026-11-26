import type { Metadata } from "next";
import { LegalPage, legalMetadata } from "@/components/site/legal-page";
import { termsOfService } from "@/data/angeronia";

export const metadata: Metadata = legalMetadata(termsOfService);

export default function Terms() {
  return <LegalPage document={termsOfService} />;
}
