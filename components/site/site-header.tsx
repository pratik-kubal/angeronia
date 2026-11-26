import { BRAND, nav } from "@/data/angeronia";
import { Band } from "./band";
import { TextLink } from "./text-link";
import styles from "./site-header.module.css";

type SiteHeaderProps = {
  /**
   * Where the header sits. On the home page its links are the page's own
   * hashes and the wordmark goes to the top; elsewhere (the legal pages) they
   * lead back to the home page's sections.
   */
  page: "home" | "other";
};

/**
 * The masthead on paper (DESIGN-RULES.md §7): the wordmark on your side of the
 * axis, the section links starting after it, and "Email the studio" at the right
 * margin. Under 900px the links hide and the wordmark hangs from the axis.
 * The games are not in it (ADR-020).
 */
export function SiteHeader({ page }: SiteHeaderProps) {
  const base = page === "home" ? "" : "/";
  return (
    <Band as="header" band="paper" className={styles.masthead}>
      <div className={styles.mast}>
        <a className={styles.wordmark} href={page === "home" ? "#top" : "/"}>
          {BRAND.name}
        </a>
        <nav className={styles.nav} aria-label={nav.label}>
          <ul className={styles.links} role="list">
            {nav.items.map((item) => (
              <li key={item.hash}>
                <TextLink href={`${base}${item.hash}`} emphasis="quiet" external={false}>
                  {item.label}
                </TextLink>
              </li>
            ))}
          </ul>
        </nav>
        <TextLink href={nav.action.href} emphasis="quiet" external={false} className={styles.action}>
          {nav.action.label}
        </TextLink>
      </div>
    </Band>
  );
}
