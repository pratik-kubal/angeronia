import { copy } from "@/data/angeronia";

/**
 * The first focusable thing on the page: a link that jumps past the header to
 * `#main` (design rule 10).
 *
 * `cds--visually-hidden` is Carbon's own hide-from-sight-not-from-the-tree
 * utility; unlike the SLDS pairing it replaces, it sets no `!important`, so the
 * revealed treatment is a plain `:focus` rule in `styles/_site.scss` on the
 * same element rather than on an inner span.
 *
 * It renders on the server, so it works before hydration.
 */
export function SkipLink() {
  return (
    <a href="#main" className="cds--visually-hidden site-skip-link">
      {copy.skipLink}
    </a>
  );
}
