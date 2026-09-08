import { Column, Link } from "@carbon/react";
import { Grid } from "@/components/ui/grid";
import { BrandMark } from "@/components/site/brand-mark";
import { ExternalLink } from "@/components/ui/external-link";
import { footer } from "@/data/angeronia";

/**
 * The footer.
 *
 * Four columns of the 2x grid at `lg` — the lockup at 6, then three link
 * columns — collapsing to two at `md` and one below it. The legal row is the
 * copyright and the two policy links, and nothing else.
 */
export function SiteFooter() {
  return (
    <footer className="site-footer">
      <Grid className="site-container">
        <Column sm={4} md={8} lg={6} className="site-footer__column">
          <BrandMark showSub={false} />
          <p className="site-footer__tagline site-measure">{footer.tagline}</p>
        </Column>

        {footer.columns.map((column) => (
          <Column
            key={column.title}
            sm={2}
            md={2}
            lg={3}
            className="site-footer__column"
          >
            <h2 className="site-footer__heading">{column.title}</h2>
            <ul className="site-footer__list">
              {column.links.map((link) =>
                "external" in link && link.external ? (
                  <li key={link.label}>
                    <ExternalLink href={link.href}>{link.label}</ExternalLink>
                  </li>
                ) : (
                  <li key={link.label}>
                    <Link href={link.href}>{link.label}</Link>
                  </li>
                ),
              )}
            </ul>
          </Column>
        ))}

        <Column sm={4} md={8} lg={16}>
          <div className="site-footer__legal">
            <ul className="site-footer__legal-links">
              {footer.legal.map((link) => (
                <li key={link.label}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
            <p>{footer.copyrightLeft}</p>
            <p>{footer.copyrightRight}</p>
          </div>
        </Column>
      </Grid>
    </footer>
  );
}
