import { BRAND } from "@/data/angeronia";

// Theme-aware SVG recreation of the Angeronia Labs mark: a citron disc with the
// studio's signature cursor arrow. Crisp at any size and it recolors with the
// theme (unlike the raster logo, which ships in /public for OG/social). The
// wordmark is set in the display font so it reads as one lockup with the site.
export function BrandMark({
  size = 26,
  showWord = true,
  showSub = true,
  wordSize = "1rem",
}: {
  size?: number;
  showWord?: boolean;
  showSub?: boolean;
  wordSize?: string;
}) {
  return (
    <span className="ang-brand" aria-label={BRAND.name}>
      <svg
        className="ang-brand-mark"
        width={size}
        height={size}
        viewBox="0 0 32 32"
        role="img"
        aria-hidden="true"
        focusable="false"
      >
        <circle className="disc" cx="17.5" cy="16" r="12.5" />
        {/* cursor arrow pointing up-left, seated on the disc */}
        <path
          className="cursor"
          d="M11.2 7.6 L23.4 14.1 L16.9 15.4 L20.2 22.1 L17.1 23.5 L13.8 16.8 L9.4 21.2 Z"
        />
      </svg>
      {showWord ? (
        <span style={{ display: "inline-flex", flexDirection: "column" }}>
          <span className="ang-brand-word" style={{ fontSize: wordSize }}>
            Angeronia&nbsp;Labs
          </span>
          {showSub ? <span className="ang-brand-sub">Philadelphia</span> : null}
        </span>
      ) : null}
    </span>
  );
}
