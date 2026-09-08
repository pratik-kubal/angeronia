import type * as React from "react";
import { Column, Layer } from "@carbon/react";
import { Grid } from "@/components/ui/grid";
import { Heading, Kicker } from "@/components/ui/text";
import { cx, type ClassValue } from "@/lib/cx";

/**
 * One page section: an id to link to, an optional eyebrow and heading, and the
 * vertical rhythm (`site-section`) that separates it from its neighbours.
 *
 * The container is Carbon's 2x `Grid` — it already supplies the responsive
 * margin, the gutters and the centring — with `site-container` doing nothing
 * but shortening the maximum line. Section content spans the full width of the
 * grid at every breakpoint; the rows inside it split further.
 *
 * `shade` gives the section its own ground and wraps its content in a Carbon
 * `<Layer>`, which steps every layer token inside up one level. That is how a
 * card reads correctly on both grounds without knowing which one it is on.
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

  const content = (
    <>
      {kicker ? <Kicker>{kicker}</Kicker> : null}
      {heading ? (
        <Heading level={2} size="section" id={headingId} className="site-section__heading">
          {heading}
        </Heading>
      ) : null}
      {children}
    </>
  );

  return (
    <section
      id={id}
      aria-labelledby={heading ? headingId : undefined}
      aria-label={heading ? undefined : kicker}
      className={cx("site-section", shade && "site-section_shade", className)}
    >
      <Grid className="site-container">
        <Column sm={4} md={8} lg={16}>
          {shade ? <Layer>{content}</Layer> : content}
        </Column>
      </Grid>
    </section>
  );
}
