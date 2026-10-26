"use client";

import { useEffect, useRef } from "react";
import { ArrowCounterClockwiseIcon, CheckIcon, FlameIcon } from "@phosphor-icons/react/dist/ssr";
import { RESULTS_COPY, ROUTE_NAMES } from "@/data/lamplighter";
import type { RouteDef } from "@/lib/lamplighter/route";
import { STEP } from "@/lib/lamplighter/rules";
import { FLAME_FINISH, FLAME_GLOW, FLAME_PAR } from "@/lib/lamplighter/scoring";
import type { RaceResult } from "./race/controller";

/** Seconds as m:ss.t. */
export function formatTime(seconds: number): string {
  const whole = Math.floor(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}.${Math.floor((seconds * 10) % 10)}`;
}

type Props = {
  def: RouteDef;
  result: RaceResult;
  onAgain: () => void;
  onLeave: () => void;
};

/** Over the lit lantern: the run's time, glow and sparks, and the three flames, earned or not yet. */
export function Results({ def, result, onAgain, onLeave }: Props) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => heading.current?.focus(), []);
  const flames = [
    { bit: FLAME_FINISH, label: RESULTS_COPY.flames.finish },
    { bit: FLAME_GLOW, label: RESULTS_COPY.flames.glow(def.glowGoal) },
    { bit: FLAME_PAR, label: RESULTS_COPY.flames.par(formatTime(def.par)) },
  ];
  return (
    <section className="lmp-results" aria-labelledby="lmp-results-h">
      <h2 id="lmp-results-h" ref={heading} tabIndex={-1} className="lmp-results-title">
        {RESULTS_COPY.heading(ROUTE_NAMES[def.id].name)}
      </h2>
      <ul className="lmp-flames">
        {flames.map(({ bit, label }) => {
          const earned = (result.flames & bit) !== 0;
          return (
            <li key={bit} data-earned={earned ? "" : undefined}>
              <FlameIcon size={30} weight={earned ? "fill" : "regular"} aria-hidden />
              <span>{label}</span>
              <span className="lmp-sr">{earned ? RESULTS_COPY.earned : RESULTS_COPY.missing}</span>
            </li>
          );
        })}
      </ul>
      <dl className="lmp-stats">
        <div>
          <dt>{RESULTS_COPY.time}</dt>
          <dd>{formatTime(result.ticks * STEP)}</dd>
        </div>
        <div>
          <dt>{RESULTS_COPY.glow}</dt>
          <dd>{result.glow}</dd>
        </div>
        <div>
          <dt>{RESULTS_COPY.sparks}</dt>
          <dd>{result.sparks}</dd>
        </div>
      </dl>
      <div className="lmp-actions">
        <button type="button" className="lmp-button" data-quiet="" onClick={onAgain}>
          <ArrowCounterClockwiseIcon size={18} weight="bold" aria-hidden />
          {RESULTS_COPY.again}
        </button>
        <button type="button" className="lmp-button" onClick={onLeave}>
          <CheckIcon size={18} weight="bold" aria-hidden />
          {RESULTS_COPY.leave}
        </button>
      </div>
    </section>
  );
}
