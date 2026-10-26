"use client";

import { useEffect, useLayoutEffect, useRef, useState, type MutableRefObject } from "react";
import { PauseIcon } from "@phosphor-icons/react/dist/ssr";
import { HUD } from "@/data/lamplighter";
import type { RouteId } from "@/lib/lamplighter/route";
import { compiled } from "@/lib/lamplighter/routes";
import type { Phase } from "@/lib/lamplighter/sim";
import { createInputHub } from "./input";
import { attachKeyboard } from "./input/keyboard";
import { PauseSheet } from "./menus";
import { createRace, type RaceController, type RaceResult } from "./race/controller";
import { Results } from "./results";

type Props = {
  routeId: RouteId;
  /** A new attempt starts the route over. */
  attempt: number;
  reduced: boolean;
  debug: boolean;
  /** The running race, for the development hook. */
  ctlRef: MutableRefObject<RaceController | null>;
  result: RaceResult | null;
  onFinish: (result: RaceResult) => void;
  onAgain: () => void;
  onLeave: () => void;
};

/**
 * A race: the canvas, the HUD over it, and the pause sheet and results over that. The loop itself
 * lives in createRace (race/controller.ts); this component mounts it, hands it the DOM, and shows
 * what it reports.
 */
export function Race({ routeId, attempt, reduced, debug, ctlRef, result, onFinish, onAgain, onLeave }: Props) {
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const glow = useRef<HTMLDivElement>(null);
  const time = useRef<HTMLSpanElement>(null);
  const count = useRef<HTMLDivElement>(null);
  const debugBox = useRef<HTMLParagraphElement>(null);
  const [phase, setPhase] = useState<Phase | "paused">("countdown");
  const [canRetry, setCanRetry] = useState(false);
  const route = compiled(routeId);

  // The loop reads these through refs, so a change never restarts the race.
  const live = useRef({ reduced, onFinish });
  useLayoutEffect(() => {
    live.current = { reduced, onFinish };
  });

  useEffect(() => {
    const el = stage.current!;
    const input = createInputHub();
    const ctl = createRace({
      canvas: canvas.current!,
      stage: el,
      hud: { glow: glow.current!, time: time.current!, count: count.current!, debug: debugBox.current },
      route,
      input,
      reduced: () => live.current.reduced,
      viewRoll: () => 0,
      onPhase: setPhase,
      onEvents: () => {},
      onFinish: (r) => live.current.onFinish(r),
    });
    ctlRef.current = ctl;
    const racing = () => el.dataset.phase === "countdown" || el.dataset.phase === "running";
    const offKeys = attachKeyboard(input, { active: racing, onPause: () => ctl.pause() });
    const hidden = () => {
      if (document.visibilityState === "hidden") ctl.pause();
    };
    document.addEventListener("visibilitychange", hidden);
    el.focus({ preventScroll: true });
    return () => {
      offKeys();
      document.removeEventListener("visibilitychange", hidden);
      ctl.destroy();
      if (ctlRef.current === ctl) ctlRef.current = null;
    };
  }, [route, attempt, ctlRef]);

  const pause = () => {
    setCanRetry(ctlRef.current?.hasLamp() ?? false);
    ctlRef.current?.pause();
  };
  useEffect(() => {
    if (phase === "paused") setCanRetry(ctlRef.current?.hasLamp() ?? false);
  }, [phase, ctlRef]);
  const backToRace = (act: (ctl: RaceController) => void) => {
    const ctl = ctlRef.current;
    if (!ctl) return;
    act(ctl);
    // After the sheet closes and hands focus back: Space must hop, not press a button.
    requestAnimationFrame(() => requestAnimationFrame(() => stage.current?.focus({ preventScroll: true })));
  };

  return (
    <div ref={stage} className="lmp-stage" tabIndex={-1} role="group" aria-label={HUD.stage} data-phase={phase} data-motion={reduced ? "reduced" : undefined}>
      <canvas ref={canvas} className="lmp-canvas" aria-hidden />
      <div className="lmp-hud">
        <div className="lmp-glow" ref={glow} aria-hidden>
          <span className="lmp-glow-label">{HUD.glow}</span>
          <span className="lmp-glow-track">
            <span className="lmp-glow-fill" />
          </span>
        </div>
        <span className="lmp-time" ref={time} aria-hidden />
        <button type="button" className="lmp-round" aria-label={HUD.pause} onClick={pause} disabled={phase === "finished" || phase === "paused"}>
          <PauseIcon size={20} weight="fill" aria-hidden />
        </button>
      </div>
      <div className="lmp-count" ref={count} aria-hidden />
      {debug && <p className="lmp-debug" ref={debugBox} />}
      <PauseSheet
        open={phase === "paused" && !result}
        canRetry={canRetry}
        onResume={() => backToRace((ctl) => ctl.resume())}
        onRetry={() => backToRace((ctl) => ctl.retryFromLamp())}
        onRestart={() => backToRace((ctl) => ctl.restart())}
        onLeave={onLeave}
      />
      {result && <Results def={route.def} result={result} onAgain={onAgain} onLeave={onLeave} />}
    </div>
  );
}
