import { Badge } from "@/components/slds/badge";
import { Card } from "@/components/slds/card";
import { Grid, Col } from "@/components/slds/layout";
import { Link } from "@/components/slds/link";
import { Body } from "@/components/slds/text";
import { Section } from "@/components/site/section";
import { clients, clientsHeading, clientsLabel, lowBono } from "@/data/angeronia";

/**
 * The studio's engagements: who it is building for, and the terms it will
 * start on. The page opens on this because it is the question a visitor
 * actually arrives with.
 *
 * The two halves sit side by side as two `Col`s of a `Grid` — rung 1 of the
 * selection ladder, so nothing here needed a new layout rule. They are both
 * `Card`s for the same reason: a bordered client card beside unbordered prose
 * reads as one real thing next to an aside, and the low-bono offer is not an
 * aside.
 *
 * `fill` makes them one height. It is only tolerable while the two bodies are
 * close in length — it works by letting the shorter card's body absorb the
 * whole difference, so a lopsided pair gets a pit of dead space above its
 * footer rather than a tidy row. The current pair differs by about a line, so
 * the cost is invisible. If a future client card runs much longer, balance the
 * copy rather than reaching for a taller card.
 *
 * The client card says what the organisation is before what we do for them, and
 * carries its status as a `Badge` rather than a tense buried in prose — "In
 * progress" is a fact a reader scans for, and it stops the section quietly
 * ageing into a claim about finished work.
 *
 * Heading levels: the section's `h2` over each card's `h3`, so the outline
 * reads as one topic with two parts rather than three peers.
 */
export function WhoWeBuildFor() {
  return (
    <Section id="clients" kicker={clientsLabel} heading={clientsHeading}>
      <Grid wrap stretch gutters>
        {clients.map((client) => (
          <Col key={client.name} size={12} medium={6} className="slds-m-bottom_medium">
            <Card
              heading={
                <span className="site-cluster">
                  <span>{client.name}</span>
                  <Badge variant="lightest">{client.status}</Badge>
                </span>
              }
              fill
              footer={
                <Link href={client.href} external>
                  {client.hrefText}
                </Link>
              }
            >
              <Body>{client.what}</Body>
              <p className="site-client__engagement">{client.engagement}</p>
            </Card>
          </Col>
        ))}

        <Col size={12} medium={6} className="slds-m-bottom_medium">
          <Card heading={lowBono.heading} fill>
            <blockquote className="site-coda site-lowbono__quote">
              <p>{lowBono.quote}</p>
            </blockquote>
            <Body className="slds-m-top_large">{lowBono.body}</Body>
          </Card>
        </Col>
      </Grid>
    </Section>
  );
}
