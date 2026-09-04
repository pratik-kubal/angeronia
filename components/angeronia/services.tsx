import { services, servicesHeading, servicesLabel } from "@/data/angeronia";

export function Services() {
  return (
    <section id="services" data-screen-label="Services" className="ang-section">
      <div className="ang-rule" data-reveal>
        {servicesLabel}
        <span />
      </div>
      <h2 className="ang-h2" data-reveal>
        {servicesHeading}
      </h2>
      <div className="ang-service-list">
        {services.map((s, i) => (
          <article className="ang-service-row" key={s.title} data-reveal data-reveal-delay={i * 60}>
            <h3>{s.title}</h3>
            <div className="ang-service-body">
              <p className="ang-service-blurb">{s.blurb}</p>
              <div className="ang-tags">
                {s.tags.map((t) => (
                  <span className="ang-tag" key={t}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
