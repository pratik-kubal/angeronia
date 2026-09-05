import { Idea, Compare, Package } from "@carbon/icons-react";
import { Card } from "@/components/slds/card";
import { Grid, Col } from "@/components/slds/layout";
import { Section } from "@/components/site/section";
import { philosophy } from "@/data/angeronia";

/**
 * Three beats, three cards.
 *
 * This replaces the scroll-drawn continuity line: the idea it illustrated —
 * one unbroken stroke from scope to hand-off — is now carried by the copy and
 * by the cards sitting on one row, rather than by an animation nobody with
 * reduced motion could see.
 */
const ICONS = [Idea, Compare, Package];

export function Philosophy() {
  return (
    <Section id="philosophy" kicker={philosophy.kicker} heading={philosophy.heading}>
      <Grid wrap stretch gutters>
        {philosophy.beats.map((beat, index) => (
          <Col key={beat.tag} size={12} medium={4} className="slds-m-bottom_medium">
            <Card heading={beat.tag} icon={ICONS[index]} fill>
              <p>{beat.text}</p>
            </Card>
          </Col>
        ))}
      </Grid>
    </Section>
  );
}
