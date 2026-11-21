import type * as React from "react";
import { copy, proof } from "@/data/angeronia";
import { ExternalLink } from "@/components/ui/external-link";
import { ProofPanel } from "@/components/site/proof-panels";
import { Reveal } from "@/components/site/reveal";
import { cx } from "@/lib/cx";
import styles from "./proof.module.css";

type Asset = { label: string; href: string | null };

/** The one inline style the page allows: a stagger index (design.md §6.3). */
const at = (i: number) => ({ "--i": i }) as React.CSSProperties;

/**
 * Proof of work (design.md §4.6): each claim beside the product panel that
 * backs it. The page's one interactive thing, and it needs no JavaScript: on a
 * desktop the claims are a radio group and `:has()` shows the chosen claim's
 * panel at the right; below 1000px, or without `:has()`, every panel sits
 * under its claim and nothing needs choosing.
 *
 * `assets` is for stories only: today every asset's link is null, so the list
 * is not rendered.
 */
export function Proof({ assets = proof.assets }: { assets?: readonly Asset[] } = {}) {
  const first = proof.claims.find((claim) => claim.panel !== null);
  const linked = assets.flatMap((asset) => (asset.href ? [{ ...asset, href: asset.href }] : []));

  return (
    <Reveal as="section" id="proof" className="frame section" aria-labelledby="proof-heading">
      <h2 id="proof-heading" className={cx("h-head", styles.heading)} data-reveal="rise" style={at(0)}>
        {proof.heading}
      </h2>
      <p className={cx("lead", styles.intro)} data-reveal="rise" style={at(1)}>
        {proof.intro}
      </p>

      <fieldset className={styles.exhibit}>
        <legend className="visually-hidden">{copy.proofLegend}</legend>
        <ol className={styles.claims}>
          {proof.claims.map((claim, index) => {
            const inputId = `claim-${claim.id}`;
            return (
              <li key={claim.id} className={styles.claim} data-reveal="rise" style={at(2 + index)}>
                {claim.panel ? (
                  <>
                    <input
                      className={styles.radio}
                      type="radio"
                      name="proof-claim"
                      id={inputId}
                      defaultChecked={claim === first}
                    />
                    <label className={styles.built} htmlFor={inputId}>
                      {claim.built}
                    </label>
                  </>
                ) : (
                  <p className={styles.built}>{claim.built}</p>
                )}
                <p className={styles.why}>{claim.relevance}</p>
                {claim.panel ? <ProofPanel id={claim.panel} className={styles.panel} /> : null}
              </li>
            );
          })}
        </ol>
      </fieldset>

      {linked.length > 0 ? (
        <ul className={styles.assets}>
          {linked.map((asset) => (
            <li key={asset.label}>
              <ExternalLink href={asset.href}>{asset.label}</ExternalLink>
            </li>
          ))}
        </ul>
      ) : null}
      <p className={cx("small", styles.disclaimer)} data-reveal="rise" style={at(7)}>
        {proof.disclaimer}
      </p>
    </Reveal>
  );
}
