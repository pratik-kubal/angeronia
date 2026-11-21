import { copy } from "@/data/angeronia";

/** The first focusable thing on every page, the games included: jumps to #main. */
export function SkipLink() {
  return (
    <a href="#main" className="visually-hidden skip-link">
      {copy.skipLink}
    </a>
  );
}
