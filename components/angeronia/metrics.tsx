"use client";

import { useRef } from "react";
import { metrics, metricsHeading, metricsLabel, metricsFootnote } from "@/data/angeronia";
import { useMetricsMeters } from "@/lib/angeronia/use-metrics-meters";

export function Metrics() {
  const sectionRef = useRef<HTMLElement | null>(null);
  useMetricsMeters(sectionRef);

  return (
    <section ref={sectionRef} id="proof" data-screen-label="Proof" className="ang-section">
      <div className="ang-rule" data-reveal>
        {metricsLabel}
        <span />
      </div>
      <h2 className="ang-h2" data-reveal>
        {metricsHeading}
      </h2>

      <div className="ang-meters">
        {metrics.map((m, i) => (
          <div className="ang-meter" key={m.label} data-meter-row data-reveal data-reveal-delay={i * 60}>
            <div className="ang-meter-head">
              <span className="ang-meter-label">{m.label}</span>
              <span className="ang-meter-value">
                <span
                  data-count
                  data-from={m.from}
                  data-to={m.to}
                  data-decimals={m.decimals}
                  data-suffix={m.suffix}
                >
                  {m.from.toFixed(m.decimals) + m.suffix}
                </span>
                {m.word ? <em> {m.word}</em> : null}
              </span>
            </div>
            <div className="ang-meter-track">
              {m.beforeFrac ? (
                <span className="ang-meter-ghost" data-meter-ghost data-before={m.beforeFrac} />
              ) : null}
              <span className="ang-meter-fill" data-meter-fill data-frac={m.barFrac} />
            </div>
            <p className="ang-meter-note">{m.note}</p>
          </div>
        ))}
      </div>

      <p className="ang-metrics-foot" data-reveal>
        {metricsFootnote}
      </p>
    </section>
  );
}
