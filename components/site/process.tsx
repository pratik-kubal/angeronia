import { process } from "@/data/angeronia";

/** The five steps. Stub: the heading only. Phase B (B5) builds it. */
export function Process() {
  return (
    <section id="process" aria-labelledby="process-heading" className="frame section">
      <h2 id="process-heading">{process.heading}</h2>
    </section>
  );
}
