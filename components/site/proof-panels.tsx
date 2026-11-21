import type * as React from "react";
import { proofPanels, type ProofPanelId } from "@/data/angeronia";
import { cx } from "@/lib/cx";
import styles from "./proof-panels.module.css";

type Turn = { readonly who: keyof typeof proofPanels.speakers; readonly said: string };

/** One exchange: the speaker's label from `proofPanels.speakers`, then what was said. */
function Turns({ turns }: { turns: readonly Turn[] }) {
  return (
    <div className={styles.turns}>
      {turns.map((turn) => (
        <div key={turn.said} className={styles.turn}>
          <p className={styles.who}>{proofPanels.speakers[turn.who]}</p>
          <p className={styles.said}>{turn.said}</p>
        </div>
      ))}
    </div>
  );
}

/** The two stages of a session: the plan, then its cost. */
function Talk() {
  const { stages } = proofPanels.talk;
  return (
    <>
      {stages.map((stage) => (
        <div key={stage.name} className={styles.frag}>
          <p className={styles.name}>{stage.name}</p>
          <Turns turns={stage.turns} />
          <p className={styles.note}>{stage.note}</p>
        </div>
      ))}
    </>
  );
}

/** The run step: the code with its current line, the test row, the count in words. */
function Run() {
  const { name, code, tests, note } = proofPanels.run;
  return (
    <div className={styles.frag}>
      <p className={styles.name}>{name}</p>
      <pre className={styles.code}>
        <code>
          {code.before}
          <span className={styles.current}>{code.current}</span>
          {code.after}
        </code>
      </pre>
      {/* Decorative: the note below states the count in words. */}
      <div className={styles.tests} aria-hidden="true">
        {Array.from({ length: tests.total }, (_, index) => (
          <span key={index} className={index >= tests.passed ? styles.fail : undefined} />
        ))}
      </div>
      <p className={styles.note}>{note}</p>
    </div>
  );
}

/** What one problem costs: three tiles, 1 : 2 : 4. */
function Credits() {
  const { label, steps } = proofPanels.credits;
  return (
    <ul className={styles.scale} aria-label={label}>
      {steps.map((step) => (
        <li
          key={step.name}
          className={styles.step}
          style={{ "--w": step.weight } as React.CSSProperties}
        >
          <span className={styles.stepName}>{step.name}</span>
          <span className={styles.stepCost}>{step.cost}</span>
        </li>
      ))}
    </ul>
  );
}

/** What the tutor says when a test fails, and what it does not give away. */
function Boundary() {
  const { turns, trace } = proofPanels.boundary;
  return (
    <div className={styles.frag}>
      <Turns turns={turns} />
      <ul className={styles.trace}>
        {trace.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </div>
  );
}

const PANES: Record<ProofPanelId, () => React.JSX.Element> = {
  talk: Talk,
  run: Run,
  credits: Credits,
  boundary: Boundary,
};

/**
 * One Code.Socratic product panel (design.md §4.6.1): a picture of another
 * product, rebuilt in HTML in its current look, aubergine and blush. Every
 * string comes from `proofPanels`. `data-ui` tells the design inspector this
 * is a real interface fragment.
 */
export function ProofPanel({ id, className }: { id: ProofPanelId; className?: string }) {
  const Pane = PANES[id];
  return (
    <figure className={cx(styles.pic, className)}>
      <div className={styles.pane} data-ui="">
        <Pane />
      </div>
      <figcaption className="small">{proofPanels[id].caption}</figcaption>
    </figure>
  );
}
