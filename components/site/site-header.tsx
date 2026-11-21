import { HeaderState } from "@/components/site/header-state";
import { BRAND, copy, nav } from "@/data/angeronia";

/** The site header. Stub: the name and the four links. Phase B (B1) builds it. */
export function SiteHeader({ variant }: { variant: "overlay" | "solid" }) {
  return (
    <HeaderState variant={variant} className="frame section">
      <a href="/">{BRAND.name}</a>
      <nav aria-label={copy.navLabel}>
        <ul>
          {nav.items.map((item) => (
            <li key={item.href}>
              <a href={item.href}>{item.label}</a>
            </li>
          ))}
        </ul>
      </nav>
    </HeaderState>
  );
}
