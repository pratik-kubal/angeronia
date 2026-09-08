import type { Metadata } from "next";
import { LegalPage } from "@/components/site/legal-page";
import { termsOfService } from "@/data/angeronia";

export const metadata: Metadata = {
  title: termsOfService.title,
  description: termsOfService.lede,
  alternates: { canonical: `/${termsOfService.slug}` },
};

export default function Terms() {
  return <LegalPage document={termsOfService} />;
}
