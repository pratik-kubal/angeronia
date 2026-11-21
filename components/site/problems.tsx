import { problems } from "@/data/angeronia";

/** Why agent projects stall. Stub: the heading only. Phase B (B2) builds it. */
export function Problems() {
  return (
    <section aria-labelledby="problems-heading" className="frame section">
      <h2 id="problems-heading">{problems.heading.join(" ")}</h2>
    </section>
  );
}
