import { copy } from "@/data/angeronia";
import styles from "./skip-link.module.css";

/**
 * The first focusable thing on every page: a link that jumps past the masthead
 * to `<main id="main">` (DESIGN-RULES.md §10). Rendered by app/layout.tsx, so
 * the games get it too, and each game's container is a `<main id="main">`.
 *
 * It sits above the top of the screen until it has keyboard focus, then drops
 * into the page's top-left corner in inverted ink. It renders on the server, so
 * it works before hydration and without script.
 */
export function SkipLink() {
  return (
    <a href="#main" className={styles.skip}>
      {copy.skipLink}
    </a>
  );
}
