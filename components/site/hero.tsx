import { Button } from "@/components/slds/button";
import { Container, Grid, Col } from "@/components/slds/layout";
import { Heading, Kicker, Body } from "@/components/slds/text";
import { MobiusFigure } from "./mobius-figure";
import { hero } from "@/data/angeronia";

/**
 * The page opening.
 *
 * Two columns from the medium breakpoint up — copy at 7/12, the Möbius at
 * 5/12, the same split the product spotlight uses — and one stacked column
 * below it, where the figure drops out entirely. The heading stays held to
 * `sizing-heading-2` (25ch) so the display line breaks where it should rather
 * than where its column happens to end.
 *
 * The figure is the page's one illustration (design rule 9) and the only thing
 * on the site that moves by itself; ADR-012 and ADR-013 carry the reasoning.
 */
export function Hero() {
  return (
    <section className="site-section site-hero" aria-labelledby="hero-heading">
      <Container size="x-large">
        <Grid wrap gutters="large" verticalAlign="center">
          <Col size={12} medium={7}>
            <Kicker>{hero.kicker}</Kicker>
            <Heading
              level={1}
              size="display"
              id="hero-heading"
              className="site-measure_heading slds-m-top_small"
            >
              {hero.h1}
            </Heading>
            <Button
              variant="brand"
              href={hero.ctaPrimary.href}
              className="slds-m-top_large"
            >
              {hero.ctaPrimary.label}
            </Button>
          </Col>

          <Col size={12} medium={5} className="site-hero__figcol">
            <MobiusFigure />
          </Col>
        </Grid>
      </Container>
    </section>
  );
}
