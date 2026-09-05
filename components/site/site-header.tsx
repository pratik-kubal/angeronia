import { Button } from "@/components/slds/button";
import { BrandMark } from "@/components/site/brand-mark";
import { ColorSchemeSwitcher } from "@/components/site/color-scheme-switcher";
import { Container } from "@/components/slds/layout";
import { BRAND, nav } from "@/data/angeronia";

/**
 * The site header.
 *
 * Built from layout utilities and Tier-1 parts rather than
 * `slds-context-bar` — the SLDS Global Header and Global Navigation are
 * Salesforce application chrome and are out of scope (D10, plan §2.9).
 *
 * The nav links collapse out of view below the medium breakpoint, where the
 * in-page anchors they point at are only a scroll away; the CTA and the scheme
 * switcher stay, because neither has an alternative route.
 */
export function SiteHeader() {
  return (
    <header className="site-header">
      <Container size="x-large">
        <div className="slds-grid slds-grid_align-spread slds-grid_vertical-align-center site-header__bar">
          <a href="/" className="site-header__brand" aria-label={`${BRAND.name} — home`}>
            <BrandMark />
          </a>

          <nav aria-label={nav.label} className="site-header__nav">
            <ul className="slds-list_horizontal slds-has-dividers_left">
              {nav.items.map((item) => (
                <li key={item.href} className="slds-list__item">
                  <a href={item.href}>{item.label}</a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="slds-grid slds-grid_vertical-align-center site-header__actions">
            <ColorSchemeSwitcher />
            <Button variant="neutral" href={nav.cta.href}>
              {nav.cta.label}
            </Button>
          </div>
        </div>
      </Container>
    </header>
  );
}
