"use client";

import { useSectionReveals } from "@/lib/angeronia/use-section-reveals";

// Behaviour-only island: runs the enter-reveal observer over [data-reveal]
// elements. Renders nothing.
export function Reveals() {
  useSectionReveals();
  return null;
}
