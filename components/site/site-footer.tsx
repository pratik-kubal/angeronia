import { BrandMark } from "@/components/site/brand-mark";
import { Container, Grid, Col } from "@/components/slds/layout";
import { Link } from "@/components/slds/link";
import { List, ListItem } from "@/components/slds/list";
import { footer } from "@/data/angeronia";

/**
 * The footer.
 *
 * No attribution line: SLDS 2's Terms of Use require none, and naming
 * Salesforce in the product is out of scope (plan §2.9). The legal row is the
 * copyright and nothing else.
 */
export function SiteFooter() {
  return (
    <footer className="site-footer">
      <Container size="x-large">
        <Grid wrap gutters>
          <Col size={12} medium={4} className="slds-m-bottom_large">
            <BrandMark showSub={false} />
            <p className="slds-text-body_small slds-text-color_weak slds-m-top_small site-measure">
              {footer.tagline}
            </p>
          </Col>

          {footer.columns.map((column) => (
            <Col key={column.title} size={6} medium={2} className="slds-m-bottom_large">
              <h2 className="slds-text-title_caps slds-text-color_weak slds-m-bottom_x-small">
                {column.title}
              </h2>
              <List variant="vertical">
                {column.links.map((link) => (
                  <ListItem key={link.label} className="slds-m-bottom_xx-small">
                    <Link href={link.href} external={"external" in link ? link.external : undefined}>
                      {link.label}
                    </Link>
                  </ListItem>
                ))}
              </List>
            </Col>
          ))}
        </Grid>

        <div className="slds-grid slds-wrap slds-grid_align-spread site-footer__legal">
          <p className="slds-text-body_small slds-text-color_weak">{footer.copyrightLeft}</p>
          <p className="slds-text-body_small slds-text-color_weak">{footer.copyrightRight}</p>
        </div>
      </Container>
    </footer>
  );
}
