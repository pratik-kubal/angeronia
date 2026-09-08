import { Tag } from "@carbon/react";
import { Card } from "@/components/ui/card";
import { ExternalLink } from "@/components/ui/external-link";
import { Section } from "@/components/ui/section";
import { Body } from "@/components/ui/text";
import { clients, clientsHeading, clientsLabel, lowBono } from "@/data/angeronia";

/**
 * The studio's engagements: who it is building for, and the terms it will
 * start on. The page opens on this because it is the question a visitor
 * actually arrives with.
 *
 * The three cards sit on one two-up grid, so the low-bono offer is a peer of
 * the client cards rather than an aside — a bordered client card beside
 * unbordered prose would read as one real thing next to a footnote, and the
 * offer is not a footnote.
 *
 * The grid stretches every card to the row height. That is only tolerable while
 * the bodies are close in length — it works by letting the shorter card's body
 * absorb the whole difference, so a lopsided pair gets a pit of dead space
 * above its footer rather than a tidy row. The current pair differs by about a
 * line. If a future client card runs much longer, balance the copy rather than
 * reaching for a taller card.
 *
 * The client card says what the organisation is before what we do for them, and
 * carries its status as a `Tag` rather than a tense buried in prose — "In
 * progress" is a fact a reader scans for, and it stops the section quietly
 * ageing into a claim about finished work.
 *
 * Heading levels: the section's `h2` over each card's `h3`, so the outline
 * reads as one topic with two parts rather than three peers.
 */
export function WhoWeBuildFor() {
  return (
    <Section id="clients" kicker={clientsLabel} heading={clientsHeading}>
      <div className="site-cards site-cards_2">
        {clients.map((client) => (
          <Card
            key={client.name}
            heading={
              <span className="site-cluster">
                <span>{client.name}</span>
                <Tag type="outline" size="sm">
                  {client.status}
                </Tag>
              </span>
            }
            footer={<ExternalLink href={client.href}>{client.hrefText}</ExternalLink>}
          >
            <Body>{client.what}</Body>
            <p className="site-client__engagement">{client.engagement}</p>
          </Card>
        ))}

        <Card heading={lowBono.heading}>
          <blockquote className="site-coda site-lowbono__quote">
            <p>{lowBono.quote}</p>
          </blockquote>
          <Body className="site-lowbono__body">{lowBono.body}</Body>
        </Card>
      </div>
    </Section>
  );
}
