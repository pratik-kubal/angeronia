import { Terminal } from "@carbon/icons-react";
import { Badge } from "@/components/slds/badge";
import { Card } from "@/components/slds/card";
import { Cluster, Grid, Col } from "@/components/slds/layout";
import { Link } from "@/components/slds/link";
import { Heading, Body } from "@/components/slds/text";
import { Section } from "@/components/site/section";
import { CodeSocraticDemo } from "@/components/site/code-socratic-demo";
import { product } from "@/data/angeronia";

/**
 * Code Socratic — the studio's own product, met the way a customer meets it.
 *
 * The card used to argue from the studio's side: what the thing is built from,
 * closing on it as proof the consultancy can ship. It now leads with the
 * product's own question, answers "why would I use this" three times, and shows
 * a session rather than describing one (ADR-014). The stack stays, but as a
 * footnote to the argument instead of the argument itself.
 */
export function ProductSpotlight() {
  return (
    <Section id="product" kicker={product.label} shade>
      <Card
        heading={
          <span className="site-cluster">
            <span>{product.name}</span>
            <Badge variant="lightest">{product.kicker}</Badge>
          </span>
        }
        headingLevel={2}
        icon={Terminal}
        footer={
          <Link href={product.cta.href} external>
            {product.cta.label}
          </Link>
        }
      >
        <Heading level={3} size="medium" className="site-measure_heading">
          {product.headline}
        </Heading>
        <Body className="slds-m-top_medium site-measure">{product.body}</Body>

        <div className="slds-m-top_large">
          <CodeSocraticDemo />
        </div>

        <Grid wrap gutters="large" className="slds-m-top_large">
          {product.benefits.map((benefit) => (
            <Col key={benefit.title} size={12} medium={4} className="slds-m-bottom_medium">
              <h4 className="site-benefit__title">{benefit.title}</h4>
              <p className="site-benefit__body">{benefit.body}</p>
            </Col>
          ))}
        </Grid>

        <ul className="site-facts">
          {product.facts.map((fact) => (
            <li key={fact} className="site-facts__item">
              {fact}
            </li>
          ))}
        </ul>

        <p className="slds-text-title slds-m-top_large">{product.tagsLabel}</p>
        <Cluster className="slds-m-top_x-small">
          {product.tags.map((tag) => (
            <Badge key={tag}>{tag}</Badge>
          ))}
        </Cluster>
      </Card>
    </Section>
  );
}
