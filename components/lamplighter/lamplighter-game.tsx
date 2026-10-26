"use client";

import { useEffect, useRef, useState } from "react";
import { HouseSimpleIcon, PlayIcon } from "@phosphor-icons/react/dist/ssr";
import { ALL_GAMES, TITLE } from "@/data/lamplighter";
import type { RouteId } from "@/lib/lamplighter/route";
import { useDebug, useReducedMotion } from "./hooks";
import { Race } from "./race";
import type { RaceController, RaceResult } from "./race/controller";

type Screen = { kind: "title" } | { kind: "race"; route: RouteId; attempt: number; result: RaceResult | null };

/** Lamplighter: the title, the route map, a race and its result, one screen at a time. */
export function LamplighterGame() {
  const [screen, setScreen] = useState<Screen>({ kind: "title" });
  const reduced = useReducedMotion();
  const debug = useDebug();
  const ctlRef = useRef<RaceController | null>(null);

  // Development only: the end-to-end specs drive and read the race through window.__lamplighter.
  // The import sits inside the condition (not after an early return) so the production build
  // drops the chunk, and the bots in it, altogether.
  useEffect(() => {
    let off = () => {};
    let gone = false;
    if (process.env.NODE_ENV !== "production") {
      import("./race/dev-hook").then((m) => {
        if (!gone) off = m.install(ctlRef);
      });
    }
    return () => {
      gone = true;
      off();
    };
  }, []);

  const racing = screen.kind === "race";
  return (
    <main id="main" className="lmp-game" data-screen={screen.kind}>
      {racing && <h1 className="lmp-sr">{TITLE.name}</h1>}
      {screen.kind === "title" && (
        <div className="lmp-screen">
          <header className="lmp-bar">
            <a href={ALL_GAMES.href} className="lmp-round" aria-label={ALL_GAMES.label}>
              <HouseSimpleIcon size={20} weight="bold" aria-hidden />
            </a>
          </header>
          <div className="lmp-title">
            <h1 className="lmp-name">{TITLE.name}</h1>
            <p className="lmp-tagline">{TITLE.tagline}</p>
            <button type="button" className="lmp-play" onClick={() => setScreen({ kind: "race", route: "first-light", attempt: 0, result: null })}>
              <PlayIcon size={20} weight="fill" aria-hidden />
              {TITLE.play}
            </button>
          </div>
        </div>
      )}
      {screen.kind === "race" && (
        <Race
          routeId={screen.route}
          attempt={screen.attempt}
          reduced={reduced}
          debug={debug}
          ctlRef={ctlRef}
          result={screen.result}
          onFinish={(result) => setScreen((s) => (s.kind === "race" ? { ...s, result } : s))}
          onAgain={() => setScreen((s) => (s.kind === "race" ? { ...s, attempt: s.attempt + 1, result: null } : s))}
          onLeave={() => setScreen({ kind: "title" })}
        />
      )}
    </main>
  );
}
