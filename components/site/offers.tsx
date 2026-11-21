import type * as React from "react";
import { offers } from "@/data/angeronia";
import type { Offer } from "@/data/angeronia";
import { ButtonLink } from "@/components/ui/button-link";
import { Reveal } from "@/components/site/reveal";
import { cx } from "@/lib/cx";
import styles from "./offers.module.css";

/** The stagger index: the one inline style this page allows (README §4.1, rule 3). */
function stagger(index: number): React.CSSProperties {
  return { "--i": index } as React.CSSProperties;
}

function findOffer(id: Offer["id"]): Offer {
  const found = offers.items.find((item) => item.id === id);
  if (!found) throw new Error(`offers.items has no "${id}" offer`);
  return found;
}

function Bullets({ offer }: { offer: Offer }) {
  if (!offer.bullets) return null;
  return (
    <ul className={styles.bullets} aria-label={offers.labels.included}>
      {offer.bullets.map((bullet) => (
        <li key={bullet}>{bullet}</li>
      ))}
    </ul>
  );
}

function BestFor({ offer }: { offer: Offer }) {
  return (
    <dl className={styles.terms}>
      <div>
        <dt className="small">{offers.labels.bestFor}</dt>
        <dd>{offer.bestFor}</dd>
      </div>
    </dl>
  );
}

/**
 * The three offers (design.md §4.5): the lead offer as one sentence with its
 * price on a gold block, then the whole of every offer. The lead offer is the
 * first item; the other two are found by id, so their order on the page is
 * fixed by the markup and not by the data.
 */
export function Offers() {
  const lead = offers.items[0];
  const fractional = findOffer("fractional");
  const sprint = findOffer("sprint");

  return (
    <Reveal
      as="section"
      id="offers"
      className={cx("section", styles.offers)}
      aria-labelledby="offers-heading"
    >
      <div className="frame">
        <p className={cx("lead", styles.intro)} data-reveal="rise" style={stagger(0)}>
          {offers.intro}
        </p>
        <h2 id="offers-heading" className={cx("h-statement", styles.statement)}>
          <span className={cx(styles.line, styles.clip)}>
            <span data-reveal="line" style={stagger(0)}>
              {offers.headline.line}
            </span>
          </span>{" "}
          <span className={styles.line}>
            <mark className={styles.price} data-reveal="wipe">
              {offers.headline.price}
            </mark>
          </span>
        </h2>

        <article className={styles.leadOffer}>
          <div className={styles.what} data-reveal="rise" style={stagger(2)}>
            <h3 className={cx("lead", styles.name)}>{lead.name}</h3>
            <p className={styles.priceLabel}>{lead.priceLabel}</p>
            <Bullets offer={lead} />
          </div>
          <dl className={styles.terms} data-reveal="rise" style={stagger(3)}>
            <div>
              <dt className="small">{offers.labels.bestFor}</dt>
              <dd>{lead.bestFor}</dd>
            </div>
            {lead.notIncluded ? (
              <div>
                <dt className="small">{offers.labels.notIncluded}</dt>
                <dd>{lead.notIncluded}</dd>
              </div>
            ) : null}
          </dl>
          <div className={styles.book} data-reveal="rise" style={stagger(3)}>
            <ButtonLink href={offers.after.cta.href}>{offers.after.cta.label}</ButtonLink>
          </div>
        </article>

        <div className={styles.others}>
          <article
            className={cx(styles.offer, styles.fractional)}
            data-reveal="rise"
            style={stagger(4)}
          >
            <h3 className={cx("lead", styles.name)}>{fractional.name}</h3>
            <p className={styles.priceLabel}>{fractional.priceLabel}</p>
            {fractional.tiers ? (
              <dl className={styles.tiers}>
                {fractional.tiers.map((tier) => (
                  <div key={tier.hours} className={styles.tier}>
                    <dt>{tier.hours}</dt>
                    <dd>{tier.price}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
            {fractional.body ? <p className={styles.body}>{fractional.body}</p> : null}
            <BestFor offer={fractional} />
          </article>
          <article
            className={cx(styles.offer, styles.sprint)}
            data-reveal="rise"
            style={stagger(5)}
          >
            <h3 className={cx("lead", styles.name)}>{sprint.name}</h3>
            <p className={styles.priceLabel}>{sprint.priceLabel}</p>
            <Bullets offer={sprint} />
            <BestFor offer={sprint} />
          </article>
        </div>

        <p className={cx("lead", styles.after)} data-reveal="rise" style={stagger(6)}>
          {offers.after.text} <a href={offers.after.cta.href}>{offers.after.cta.label}</a>
        </p>
      </div>
    </Reveal>
  );
}
