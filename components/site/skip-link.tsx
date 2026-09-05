import { copy } from "@/data/angeronia";

/**
 * The first focusable thing on the page: a link that jumps past the header to
 * `#main` (design rule 10, SLDS Accessibility → Keyboard Interaction).
 *
 * `slds-assistive-text` hides it from sight but not from the accessibility
 * tree, and `slds-assistive-text_focus` — SLDS's own pairing for exactly this
 * — brings it back on keyboard focus. Both set their properties `!important`,
 * so the visible treatment lives on an inner span rather than fighting them.
 *
 * It renders on the server, so it works before hydration.
 */
export function SkipLink() {
  return (
    <a
      href="#main"
      className="slds-assistive-text slds-assistive-text_focus site-skip-link"
    >
      <span className="site-skip-link__label">{copy.skipLink}</span>
    </a>
  );
}
