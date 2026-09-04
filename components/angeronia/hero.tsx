import { hero } from "@/data/angeronia";
import { MobiusFigure } from "./mobius-figure";

export function Hero() {
  return (
    <header data-screen-label="Hero" className="ang-hero ang-bleed">
      <div className="ang-hero-inner">
        <div className="ang-hero-top">
          <div className="ang-hero-intro">
            <p className="ang-kicker">{hero.kicker}</p>
            <h1 className="ang-h1">{hero.h1}</h1>
            <p className="ang-subhead">{hero.subhead}</p>
            <p className="ang-hero-body">{hero.body}</p>
          </div>
          <div className="ang-hero-figwrap">
            <MobiusFigure mode="auto" ariaLabel={hero.figureAlt} />
          </div>
        </div>

        <div className="ang-hero-lower">
          <div className="ang-cta-row">
            <a href={hero.ctaPrimary.href} className="ang-btn ang-btn-fill">
              {hero.ctaPrimary.label}
            </a>
            <a href={hero.ctaSecondary.href} className="ang-btn ang-btn-cta">
              {hero.ctaSecondary.label}
            </a>
          </div>
          <p className="ang-scrollhint">
            {hero.scrollHint} <span aria-hidden="true">↓</span>
          </p>
        </div>
      </div>
    </header>
  );
}
