import { faq } from "@/data/angeronia";

/** The questions, every answer open. Stub: the heading only. Phase B (B5) builds it. */
export function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-heading" className="frame section">
      <h2 id="faq-heading">{faq.heading}</h2>
    </section>
  );
}
