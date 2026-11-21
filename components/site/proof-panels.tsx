import { proofPanels, type ProofPanelId } from "@/data/angeronia";

/** One Code.Socratic product panel. Stub: the caption only. Phase B (B4) builds it. */
export function ProofPanel({ id, className }: { id: ProofPanelId; className?: string }) {
  return (
    <figure className={className}>
      <figcaption>{proofPanels[id].caption}</figcaption>
    </figure>
  );
}
