import type * as React from "react";
import { Container } from "@/components/slds/layout";
import { Heading, Kicker } from "@/components/slds/text";
import { cx, type ClassValue } from "@/lib/slds/cx";

/**
 * One page section: an id to link to, an optional eyebrow and heading, and the
 * vertical rhythm (`site-section`) that separates it from its neighbours.
 *
 * Every section heading is an `h2` and is wired to the section's
 * `aria-labelledby`, so the page's landmarks and its outline agree.
 */
export interface SectionProps {
  id: string;
  kicker?: string;
  heading?: string;
  /** Give the section its own ground, so the rhythm reads as a band. */
  shade?: boolean;
  className?: ClassValue;
  children: React.ReactNode;
}

export function Section({ id, kicker, heading, shade, className, children }: SectionProps) {
  const headingId = `${id}-heading`;

  return (
    <section
      id={id}
      aria-labelledby={heading ? headingId : undefined}
      aria-label={heading ? undefined : kicker}
      className={cx("site-section", shade && "site-section_shade", className)}
    >
      <Container size="x-large">
        {kicker ? <Kicker>{kicker}</Kicker> : null}
        {heading ? (
          <Heading
            level={2}
            size="large"
            id={headingId}
            className="site-measure_heading slds-m-top_x-small slds-m-bottom_large"
          >
            {heading}
          </Heading>
        ) : null}
        {children}
      </Container>
    </section>
  );
}
