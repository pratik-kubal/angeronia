import { BRAND } from "@/data/angeronia";
import { cx, type ClassValue } from "@/lib/slds/cx";

/**
 * The Angeronia Labs mark: a disc with the studio's cursor.
 *
 * Drawn in hooks, not hexes — the disc is `accent-container-1` (Teal 60 in both
 * schemes) and the cursor is its paired `on-accent-1`, which is what makes it
 * legible at 4.99:1 without the component knowing what colour either one is
 * (D6, design rule 4). `scripts/build-logos.mjs` renders the same geometry for
 * the OG/social rasters.
 *
 * The wordmark and sub-line are text, not paths, so they inherit the page's
 * type and stay selectable and translatable.
 */
export function BrandMark({
  size = 28,
  showWord = true,
  showSub = true,
  className,
}: {
  size?: number;
  showWord?: boolean;
  showSub?: boolean;
  className?: ClassValue;
}) {
  return (
    <span className={cx("slds-media slds-media_center site-brand", className)}>
      <span className="slds-media__figure">
        <svg
          className="site-brand__mark"
          width={size}
          height={size}
          viewBox="0 0 32 32"
          role="img"
          aria-label={showWord ? undefined : BRAND.name}
          aria-hidden={showWord ? "true" : undefined}
          focusable="false"
        >
          <circle className="site-brand__disc" cx="17.5" cy="16" r="12.5" />
          {/* Cursor arrow, up-left, seated on the disc. */}
          <path
            className="site-brand__cursor"
            d="M11.2 7.6 L23.4 14.1 L16.9 15.4 L20.2 22.1 L17.1 23.5 L13.8 16.8 L9.4 21.2 Z"
          />
        </svg>
      </span>
      {showWord ? (
        <span className="slds-media__body">
          <span className="site-brand__word">Angeronia&nbsp;Labs</span>
          {showSub ? (
            <span className="slds-text-title_caps slds-text-color_weak site-brand__sub">
              {BRAND.city.split(",")[0]}
            </span>
          ) : null}
        </span>
      ) : null}
    </span>
  );
}
