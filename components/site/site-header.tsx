import { BrandMark } from "@/components/site/brand-mark";
import { HeaderState } from "@/components/site/header-state";
import { ButtonLink } from "@/components/ui/button-link";
import { BRAND, copy, nav } from "@/data/angeronia";
import styles from "./site-header.module.css";

/**
 * The site header (design.md §4.1): the name, the four section links and one
 * button. Transparent over the photograph, solid once the page has scrolled.
 */
export function SiteHeader({ variant }: { variant: "overlay" | "solid" }) {
  // The four links name sections of the home page. The solid header is the
  // legal pages', where those sections are not, so its links go home first.
  const base = variant === "solid" ? "/" : "";
  return (
    <HeaderState variant={variant} className={styles.header}>
      <a className={styles.brand} href="/">
        <BrandMark size={22} />
        <span>{BRAND.name}</span>
      </a>
      <nav className={styles.nav} aria-label={copy.navLabel}>
        <ul className={styles.list}>
          {nav.items.map((item) => (
            <li key={item.href}>
              <a className={styles.link} href={`${base}${item.href}`}>
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <ButtonLink className={styles.cta} size="sm" href={nav.cta.href}>
        {nav.cta.label}
      </ButtonLink>
    </HeaderState>
  );
}
