import { philosophy } from "@/data/angeronia";

// A single continuous stroke that draws itself on scroll (see use-continuity-scrub).
// No-JS / reduced-motion renders it fully drawn. The three node dots are seated
// onto the path at runtime and light as the pen passes them.
const PATH_D =
  "M 34 296 C 96 296 118 150 196 150 C 274 150 262 322 344 300 C 428 278 434 128 356 122 C 300 118 286 214 338 244";

export function ContinuityLine() {
  return (
    <div className="ang-line-fig" role="img" aria-label={philosophy.lineAlt}>
      <svg viewBox="0 0 480 380" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        {/* faint ghost of the full path so the drawn stroke reads against it */}
        <path
          d={PATH_D}
          fill="none"
          stroke="var(--line)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          data-line-path
          d={PATH_D}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {philosophy.beats.map((_, i) => (
          <circle
            key={i}
            data-line-node
            data-lit="false"
            r="7"
            cx="0"
            cy="0"
          />
        ))}
        <circle data-line-pen r="6" cx="34" cy="296" />
      </svg>
      <p className="ang-line-progress" data-line-progress>
        {philosophy.caption}
      </p>
    </div>
  );
}
