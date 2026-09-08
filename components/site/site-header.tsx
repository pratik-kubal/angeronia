import { Button, Column, Link } from "@carbon/react";
import { Grid } from "@/components/ui/grid";
import { BrandMark } from "@/components/site/brand-mark";
import { ColorSchemeSwitcher } from "@/components/site/color-scheme-switcher";
import { nav } from "@/data/angeronia";

/**
 * The site header.
 *
 * Built from the grid and Tier-1 parts rather than Carbon's `UIShell`
 * `Header` — the UI Shell is application chrome for a product with a global
 * nav, and this is a five-link marketing bar that has to sit inside the page's
 * own container rather than pin itself to the viewport.
 *
 * The nav links collapse out of view below `lg`, where the in-page anchors they
 * point at are only a scroll away; the CTA and the scheme switcher stay,
 * because neither has an alternative route.
 */
export function SiteHeader() {
  return (
    <header className="site-header">
      <Grid className="site-container">
        <Column sm={4} md={8} lg={16}>
          <div className="site-header__bar">
            {/* No `aria-label`: the lockup renders the studio name as text, so
                an added label would replace the visible words with different
                ones — WCAG 2.5.3 Label in Name. */}
            <a href="/" className="site-header__brand">
              <BrandMark />
            </a>

            <nav aria-label={nav.label} className="site-header__nav">
              <ul className="site-header__nav-list">
                {nav.items.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href}>{item.label}</Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="site-header__actions">
              <ColorSchemeSwitcher />
              <Button kind="tertiary" size="sm" href={nav.cta.href}>
                {nav.cta.label}
              </Button>
            </div>
          </div>
        </Column>
      </Grid>
    </header>
  );
}
