import type * as React from "react";
import { Reveal } from "@/components/site/reveal";
import { ExternalLink } from "@/components/ui/external-link";
import { product } from "@/data/angeronia";
import styles from "./product.module.css";

/** The one inline style the page allows: a reveal index, which is data. */
const stagger = (i: number) => ({ "--i": i }) as React.CSSProperties;

/** Also from Angeronia Labs: Code.Socratic, small on purpose (design.md §4.9). */
export function Product() {
  const [first, second] = product.heading;
  return (
    <Reveal as="section" className={`frame ${styles.product}`} aria-labelledby="product-heading">
      <h2
        id="product-heading"
        className={`h-head lines ${styles.heading}`}
        data-reveal="rise"
        style={stagger(0)}
      >
        <span>{first}</span> <span>{second}</span>
      </h2>
      <div className={styles.about} data-reveal="rise" style={stagger(1)}>
        <p className={styles.blurb}>{product.blurb}</p>
        <p className={styles.links}>
          <ExternalLink href={product.visit.href}>{product.visit.label}</ExternalLink>
          {product.build ? (
            <ExternalLink href={product.build.href}>{product.build.label}</ExternalLink>
          ) : null}
        </p>
      </div>
    </Reveal>
  );
}
