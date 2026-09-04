"use client";

import { useRef } from "react";
import { processSteps, processHeading, processLabel } from "@/data/angeronia";
import { useProcessScrub } from "@/lib/angeronia/use-process-scrub";

export function Process() {
  const sectionRef = useRef<HTMLElement | null>(null);
  useProcessScrub(sectionRef);

  return (
    <section ref={sectionRef} id="process" data-screen-label="How we work" className="ang-section">
      <div className="ang-rule" data-reveal>
        {processLabel}
        <span />
      </div>
      <h2 className="ang-h2" data-reveal>
        {processHeading}
      </h2>
      <div className="ang-process-track">
        <div className="ang-process-rail" data-process-rail>
          <div className="ang-process-fill" data-process-fill />
        </div>
        {processSteps.map((step) => (
          <div className="ang-process-step" key={step.title} data-process-step data-reached="false">
            <span className="ang-process-dot" data-process-dot aria-hidden="true" />
            <h3>{step.title}</h3>
            <p>{step.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
