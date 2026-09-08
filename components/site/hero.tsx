import { Button, Column } from "@carbon/react";
import { Grid } from "@/components/ui/grid";
import { Heading, Kicker } from "@/components/ui/text";
import { MobiusFigure } from "./mobius-figure";
import { hero } from "@/data/angeronia";

/**
 * The page opening.
 *
 * Two columns from `md` up — copy at 5/8 then 9/16, the Möbius at 3/8 then
 * 7/16 — and one stacked column below it, where the figure drops out entirely.
 * The heading stays held to the heading measure so the display line breaks
 * where it should rather than where its column happens to end.
 *
 * The figure is the page's one illustration (design rule 9) and the only thing
 * on the site that moves by itself; ADR-012 and ADR-013 carry the reasoning.
 */
export function Hero() {
  return (
    <section className="site-section site-hero" aria-labelledby="hero-heading">
      <Grid className="site-container">
        <Column sm={4} md={5} lg={9} className="site-hero__copy">
          <Kicker>{hero.kicker}</Kicker>
          <Heading
            level={1}
            size="display"
            id="hero-heading"
            className="site-measure_heading site-hero__heading"
          >
            {hero.h1}
          </Heading>
          <Button kind="primary" href={hero.ctaPrimary.href}>
            {hero.ctaPrimary.label}
          </Button>
        </Column>

        <Column sm={4} md={3} lg={7} className="site-hero__figcol">
          <MobiusFigure />
        </Column>
      </Grid>
    </section>
  );
}
