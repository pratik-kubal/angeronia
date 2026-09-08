import { cx, type ClassValue } from "@/lib/slds/cx";

export interface Crumb {
  label: string;
  href?: string;
}

/**
 * The SLDS 2 Breadcrumbs blueprint.
 *
 * The `<nav>` is named, so a screen reader can tell this trail from the site's
 * primary navigation. The last crumb is the current page: it is not a link,
 * and it carries `aria-current="page"` — a link to where you already are is
 * noise.
 */
export interface BreadcrumbsProps {
  items: Crumb[];
  label?: string;
  className?: ClassValue;
}

export function Breadcrumbs({ items, label = "Breadcrumbs", className }: BreadcrumbsProps) {
  return (
    <nav aria-label={label} className={className ? cx(className) : undefined}>
      <ol className="slds-breadcrumb slds-list_horizontal slds-wrap">
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <li key={item.label} className="slds-breadcrumb__item">
              {last || !item.href ? (
                <span aria-current={last ? "page" : undefined}>{item.label}</span>
              ) : (
                <a href={item.href}>{item.label}</a>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
