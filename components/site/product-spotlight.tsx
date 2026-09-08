import { Terminal } from "@carbon/icons-react";
import { Tag } from "@carbon/react";
import { Card } from "@/components/ui/card";
import { Cluster } from "@/components/ui/cluster";
import { ExternalLink } from "@/components/ui/external-link";
import { Section } from "@/components/ui/section";
import { Body } from "@/components/ui/text";
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
            <Tag type="outline" size="sm">
              {product.kicker}
            </Tag>
          </span>
        }
        headingLevel={2}
        icon={Terminal}
        footer={<ExternalLink href={product.cta.href}>{product.cta.label}</ExternalLink>}
      >
        <h3 className="site-product__headline site-measure_heading">{product.headline}</h3>
        <Body className="site-product__body">{product.body}</Body>

        <div className="site-product__demo">
          <CodeSocraticDemo />
        </div>

        <div className="site-benefits site-product__benefits">
          {product.benefits.map((benefit) => (
            <div key={benefit.title}>
              <h4 className="site-benefit__title">{benefit.title}</h4>
              <p className="site-benefit__body">{benefit.body}</p>
            </div>
          ))}
        </div>

        <ul className="site-facts">
          {product.facts.map((fact) => (
            <li key={fact} className="site-facts__item">
              {fact}
            </li>
          ))}
        </ul>

        <p className="site-product__tags-label">{product.tagsLabel}</p>
        <Cluster>
          {product.tags.map((tag) => (
            <Tag key={tag} type="outline" size="sm">
              {tag}
            </Tag>
          ))}
        </Cluster>
      </Card>
    </Section>
  );
}
