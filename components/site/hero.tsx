import { ArrowRight } from "@carbon/icons-react";
import { Button } from "@/components/slds/button";
import { Container, Cluster } from "@/components/slds/layout";
import { Heading, Kicker, Body } from "@/components/slds/text";
import { hero } from "@/data/angeronia";

/**
 * The page opening.
 *
 * One column, held to the heading measure (`sizing-heading-2`, 25ch) so the
 * display line breaks where it should rather than where the viewport happens
 * to end. No scroll hint and no figure — motion is not scroll-linked (design
 * rule 8), and O3 puts the illustration out of Phase 3.
 */
export function Hero() {
  return (
    <section className="site-section site-hero" aria-labelledby="hero-heading">
      <Container size="x-large">
        <Kicker>{hero.kicker}</Kicker>
        <Heading
          level={1}
          size="display"
          id="hero-heading"
          className="site-measure_heading slds-m-top_small"
        >
          {hero.h1}
        </Heading>
        <Body className="slds-m-top_medium site-hero__lede">{hero.body}</Body>
        <Cluster gap="medium" className="slds-m-top_large">
          <Button variant="brand" href={hero.ctaPrimary.href}>
            {hero.ctaPrimary.label}
          </Button>
          <Button variant="neutral" href={hero.ctaSecondary.href} iconRight={ArrowRight}>
            {hero.ctaSecondary.label}
          </Button>
        </Cluster>
      </Container>
    </section>
  );
}
