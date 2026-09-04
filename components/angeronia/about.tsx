import {
  aboutLabel,
  aboutHeading,
  aboutLead,
  aboutKicker,
  aboutRange,
  aboutCoda,
} from "@/data/angeronia";

export function About() {
  return (
    <section id="about" data-screen-label="About" className="ang-section">
      <div className="ang-rule" data-reveal>
        {aboutLabel}
        <span />
      </div>
      <h2 className="ang-h2" data-reveal>
        {aboutHeading}
      </h2>
      <p className="ang-about-lead" data-reveal>
        {aboutLead}
      </p>

      <p className="ang-about-kicker" data-reveal>
        {aboutKicker}
      </p>
      <div className="ang-range" role="list">
        {aboutRange.map((r, i) => (
          <span
            className="ang-range-seg"
            role="listitem"
            key={r}
            data-reveal
            data-reveal-delay={i * 90}
          >
            <span className="ang-range-dot" aria-hidden="true" />
            {r}
          </span>
        ))}
      </div>

      <p className="ang-about-coda" data-reveal>
        {aboutCoda}
      </p>
    </section>
  );
}
