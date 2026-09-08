"use client";

import * as React from "react";
import {
  Chat,
  CheckmarkOutline,
  Incomplete,
  Notebook,
  Play,
  Result,
  SendFilled,
  TestTool,
  Time,
} from "@carbon/icons-react";
import { Badge } from "@/components/slds/badge";
import { CodeBlock } from "@/components/site/code-block";
import { productDemo } from "@/data/angeronia";

/**
 * The Code Socratic session workspace, with the problem solved.
 *
 * A replica of the preview on the product's own landing page
 * (`../code-socratic/apps/web/components/SessionPreview.tsx`): the bar, the
 * editor with its gutter, the four side tabs, the tutor's status rail and the
 * exchange, the run actions and the composer. The content is the product's; the
 * markup and every colour are this site's, because the original is Carbon and
 * rule 1 keeps Carbon out (ADR-014).
 *
 * Nothing acts. The tabs are the one thing a visitor can work — which is the
 * point, since the tabs are what show the tutoring, the tests and the score are
 * one place. Both action buttons and the composer are genuinely `disabled`, so
 * they are skipped by the keyboard rather than merely looking dead.
 */

const TABS = [
  { id: "tutor", label: productDemo.tabs.tutor, icon: Chat },
  { id: "instructions", label: productDemo.tabs.instructions, icon: Notebook },
  { id: "tests", label: productDemo.tabs.tests, icon: TestTool },
  { id: "results", label: productDemo.tabs.results, icon: Result },
] as const;

type TabId = (typeof TABS)[number]["id"];

function TutorPanel() {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Open on the newest turn, the way the live panel does — the exchange is
  // longer than the pane, and the turn worth reading is the tutor's last
  // question, not the opening line.
  React.useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  return (
    <div className="site-demo__tutor">
      <div className="site-demo__status">
        <ol className="site-demo__phases">
          {productDemo.phases.map((phase) => {
            const Glyph = phase.done ? CheckmarkOutline : Incomplete;
            return (
              <li key={phase.label} className="site-demo__phase">
                <Glyph size={16} aria-hidden="true" />
                <span>{phase.label}</span>
                <span className="slds-assistive-text">
                  {phase.done ? " — complete" : " — in progress"}
                </span>
              </li>
            );
          })}
        </ol>
        <p className="site-demo__stat">
          {productDemo.stats.hintsLabel} <strong>{productDemo.stats.hints}</strong>
        </p>
        <p className="site-demo__stat">
          <Time size={16} aria-hidden="true" />
          <strong>{productDemo.stats.time}</strong>
        </p>
      </div>

      <div className="site-demo__scroll" ref={scrollRef}>
        <ol className="site-demo__chat">
          {productDemo.chat.map((turn, index) => (
            <li
              key={index}
              className={`site-demo__msg site-demo__msg_${turn.who === "Tutor" ? "tutor" : "you"}`}
            >
              <p className="site-demo__who">{turn.who}</p>
              <p className="site-demo__said">{turn.said}</p>
            </li>
          ))}
        </ol>
      </div>

      <div className="site-demo__composer">
        <span className="site-demo__field" aria-hidden="true">
          {productDemo.composer.placeholder}
        </span>
        <button type="button" className="site-demo__send" disabled>
          {productDemo.composer.send}
          <SendFilled size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function InstructionsPanel() {
  return (
    <div className="site-demo__scroll site-demo__prose">
      <div className="site-demo__prose-head">
        <h4 className="site-demo__prose-title">{productDemo.bar.title}</h4>
        <Badge variant="lightest">{productDemo.bar.difficulty}</Badge>
      </div>
      {productDemo.instructions.paragraphs.map((parts, i) => (
        <p key={i}>
          {parts.map((part, j) =>
            typeof part === "string" ? (
              <React.Fragment key={j}>{part}</React.Fragment>
            ) : "code" in part ? (
              <code key={j}>{part.code}</code>
            ) : (
              <strong key={j}>{part.strong}</strong>
            ),
          )}
        </p>
      ))}
      <h5 className="site-demo__prose-sub">{productDemo.instructions.exampleHeading}</h5>
      <CodeBlock code={productDemo.instructions.example} />
      <h5 className="site-demo__prose-sub">{productDemo.instructions.constraintsHeading}</h5>
      <ul className="site-demo__constraints">
        {productDemo.instructions.constraints.map((c) => (
          <li key={c}>
            <code>{c}</code>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TestsPanel() {
  return (
    <div className="site-demo__filepane">
      <p className="site-demo__filetab">{productDemo.testsFile}</p>
      <div className="site-demo__scroll">
        <CodeBlock code={productDemo.tests} lineNumbers />
      </div>
    </div>
  );
}

function ResultsPanel() {
  return (
    <div className="site-demo__scroll site-demo__prose">
      <p className="site-demo__results-heading">{productDemo.results.heading}</p>
      <dl className="site-demo__results">
        {productDemo.results.rows.map((row) => (
          <div key={row.label} className="site-demo__result">
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
      <p className="site-demo__note">{productDemo.results.note}</p>
    </div>
  );
}

const PANEL: Record<TabId, React.ReactNode> = {
  tutor: <TutorPanel />,
  instructions: <InstructionsPanel />,
  tests: <TestsPanel />,
  results: <ResultsPanel />,
};

export function CodeSocraticDemo() {
  const [active, setActive] = React.useState<TabId>("tutor");
  const refs = React.useRef(new Map<TabId, HTMLButtonElement>());

  // Same keyboard contract as `components/slds/tabs`: one tab stop for the
  // tablist, arrows between tabs, Home and End to the ends.
  const move = (from: number, delta: number) => {
    const next = (from + delta + TABS.length) % TABS.length;
    const id = TABS[next].id;
    setActive(id);
    refs.current.get(id)?.focus();
  };

  const onKeyDown = (event: React.KeyboardEvent, index: number) => {
    const keys: Record<string, () => void> = {
      ArrowRight: () => move(index, 1),
      ArrowLeft: () => move(index, -1),
      Home: () => move(0, 0),
      End: () => move(TABS.length - 1, 0),
    };
    const handler = keys[event.key];
    if (handler) {
      event.preventDefault();
      handler();
    }
  };

  return (
    <figure className="site-demo">
      <figcaption className="site-demo__caption">{productDemo.label}</figcaption>

      <div className="site-demo__frame">
        <header className="site-demo__bar">
          <span className="site-demo__crumbs">
            <span className="site-demo__lang">{productDemo.bar.language}</span>
            <span className="site-demo__sep" aria-hidden="true">
              /
            </span>
            <span className="site-demo__title">{productDemo.bar.title}</span>
            <Badge variant="lightest">{productDemo.bar.difficulty}</Badge>
          </span>
          <span className="site-demo__stat site-demo__credits">
            {productDemo.bar.creditsLabel} <strong>{productDemo.bar.credits}</strong>
          </span>
        </header>

        <div className="site-demo__split">
          <section className="site-demo__editor" aria-label="Solution">
            <div className="site-demo__filepane">
              <p className="site-demo__filetab">{productDemo.solutionFile}</p>
              <div className="site-demo__scroll">
                <CodeBlock code={productDemo.solution} lineNumbers />
              </div>
            </div>
            <div className="site-demo__actions">
              <button type="button" className="site-demo__btn" disabled>
                <Play size={16} aria-hidden="true" />
                {productDemo.actions.run}
                <kbd>{productDemo.actions.runKeys}</kbd>
              </button>
              <button type="button" className="site-demo__btn site-demo__btn_primary" disabled>
                {productDemo.actions.submit}
                <kbd>{productDemo.actions.submitKeys}</kbd>
              </button>
            </div>
          </section>

          <section className="site-demo__side" aria-label="Problem">
            <div className="site-demo__tabs" role="tablist" aria-label={productDemo.tabsLabel}>
              {TABS.map((tab, index) => {
                const Glyph = tab.icon;
                const selected = tab.id === active;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    id={`demo-tab-${tab.id}`}
                    aria-selected={selected}
                    aria-controls={`demo-panel-${tab.id}`}
                    tabIndex={selected ? 0 : -1}
                    className="site-demo__tab"
                    ref={(node) => {
                      if (node) refs.current.set(tab.id, node);
                      else refs.current.delete(tab.id);
                    }}
                    onClick={() => setActive(tab.id)}
                    onKeyDown={(event) => onKeyDown(event, index)}
                  >
                    <Glyph size={16} aria-hidden="true" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div
              role="tabpanel"
              id={`demo-panel-${active}`}
              aria-labelledby={`demo-tab-${active}`}
              tabIndex={0}
              className="site-demo__panel"
            >
              {PANEL[active]}
            </div>
          </section>
        </div>
      </div>

      <p className="site-demo__static">{productDemo.staticNote}</p>
    </figure>
  );
}
