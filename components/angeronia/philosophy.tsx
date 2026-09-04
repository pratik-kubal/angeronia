"use client";

import { useRef } from "react";
import { philosophy } from "@/data/angeronia";
import { ContinuityLine } from "./continuity-line";
import { useContinuityScrub } from "@/lib/angeronia/use-continuity-scrub";

export function Philosophy() {
  const sectionRef = useRef<HTMLElement | null>(null);
  useContinuityScrub(sectionRef);

  return (
    <section
      ref={sectionRef}
      id="philosophy"
      data-screen-label="Philosophy"
      className="ang-philo"
    >
      <div className="ang-philo-split">
        <div className="ang-philo-copy">
          <div className="ang-rule">
            {philosophy.kicker}
            <span />
          </div>
          <h2 className="ang-h2">{philosophy.heading}</h2>
          <div className="ang-beats">
            {philosophy.beats.map((b, i) => (
              <div key={i} className="ang-beat" data-beat data-active={i === 0 ? "true" : "false"}>
                <span className="tag">{b.tag}</span>
                <p data-beat-body>{b.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="ang-philo-fig">
          <ContinuityLine />
        </div>
      </div>
    </section>
  );
}
