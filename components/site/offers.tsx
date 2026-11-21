import { offers } from "@/data/angeronia";

/** The three offers. Stub: the headline only. Phase B (B3) builds it. */
export function Offers() {
  return (
    <section id="offers" aria-labelledby="offers-heading" className="frame section">
      <h2 id="offers-heading">
        {offers.headline.line} {offers.headline.price}
      </h2>
    </section>
  );
}
