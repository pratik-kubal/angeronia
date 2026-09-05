import { Terminal } from "@carbon/icons-react";
import { Badge } from "@/components/slds/badge";
import { Card } from "@/components/slds/card";
import { Cluster, Grid, Col } from "@/components/slds/layout";
import { Link } from "@/components/slds/link";
import { List, ListItem } from "@/components/slds/list";
import { ProgressIndicator } from "@/components/slds/progress-indicator";
import { Heading, Body } from "@/components/slds/text";
import { Section } from "@/components/site/section";
import { product } from "@/data/angeronia";

/**
 * Code Socratic — the studio's own product, as one card.
 *
 * The old version cycled the three-step loop on a timer. It is now a static
 * Progress Indicator: the loop is a fact about the product, not something that
 * needs to be performed (design rule 8, O9).
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
        <Grid wrap gutters="large">
          <Col size={12} medium={7}>
            <Heading level={3} size="medium" className="site-measure_heading">
              {product.headline}
            </Heading>

            <div className="slds-m-vertical_large site-product__loop">
              <ProgressIndicator
                steps={product.loop.map((label) => ({ label }))}
                current={product.loop.length}
                label={`${product.name} loop`}
                showLabels
              />
            </div>

            <Body>{product.body}</Body>
          </Col>

          <Col size={12} medium={5}>
            <List variant="dotted">
              {product.points.map((point) => (
                <ListItem key={point}>{point}</ListItem>
              ))}
            </List>

            <Cluster className="slds-m-top_large">
              {product.tags.map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </Cluster>

            <p className="slds-text-body_small slds-text-color_weak slds-m-top_large">
              {product.note}
            </p>
          </Col>
        </Grid>
      </Card>
    </Section>
  );
}
