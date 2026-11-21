import { product } from "@/data/angeronia";

/** Also from Angeronia Labs. Stub: the heading only. Phase B (B6) builds it. */
export function Product() {
  return (
    <section aria-labelledby="product-heading" className="frame section">
      <h2 id="product-heading">{product.heading.join(" ")}</h2>
    </section>
  );
}
