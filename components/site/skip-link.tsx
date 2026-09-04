import { copy } from "@/data/angeronia";

/**
 * The first focusable thing on the page: a link that jumps past the header to
 * `#main` (design rule 10, SLDS Accessibility → Keyboard Interaction).
 *
 * `slds-assistive-text` hides it from sight but not from the accessibility
 * tree; `site-skip-link:focus` in `app/site.css` brings it back on keyboard
 * focus. It renders on the server, so it works before hydration.
 */
export function SkipLink() {
  return (
    <a href="#main" className="slds-assistive-text site-skip-link">
      {copy.skipLink}
    </a>
  );
}
