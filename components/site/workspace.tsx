"use client";

import * as React from "react";
import { productDemo } from "@/data/angeronia";
import { cx } from "@/lib/cx";
import motionStyles from "@/styles/motion.module.css";
import { tokenizePython } from "./python-tokens";
import styles from "./workspace.module.css";

/**
 * The Code.Socratic workspace, as the product shows it (ADR-014, ADR-023): a
 * real session ("Widest Water Between Posts", in Python), the editor with the
 * solution and the side pane with its four tabs. The page's one interface
 * picture, laid across the spine at full width, so the line breaks around it.
 *
 * Product UI: its colours, radii and 13–16px type are the product's light
 * theme, literal and scoped to this module (DESIGN-RULES.md §3), and its words
 * are the product's, the user's "I" and the Results tab's figures included.
 * Both fragments carry `data-ui`.
 *
 * The tabs are the one thing that works, as the ARIA tabs pattern: click,
 * arrow keys, Home and End, with a roving tab stop. Run Tests, Submit and Send
 * are genuinely `disabled`. Without script every panel shows, stacked, each
 * under its name, as a plain block; the server renders that, and the tabs take
 * over on hydration, when the panels become tab panels (until then, with
 * script, CSS shows only the first panel, so nothing jumps). If the tabs are
 * not live after `--dur-script-wait`, CSS falls back to the no-script layout,
 * so a failed script never leaves a panel out of reach (ADR-032).
 */

const TABS = [
  { key: "tutor", label: productDemo.tabs.tutor },
  { key: "instructions", label: productDemo.tabs.instructions },
  { key: "tests", label: productDemo.tabs.tests },
  { key: "results", label: productDemo.tabs.results },
] as const;

/** The product's status glyphs, drawn inline (no icon set on the studio site). */
function Glyph({ kind }: { kind: "done" | "now" | "time" }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={styles.glyph}>
      {kind === "time" ? (
        <>
          <circle cx="8" cy="8" r="6.5" />
          <path d="M8 4.5V8l2.4 1.6" />
        </>
      ) : (
        <>
          <circle cx="8" cy="8" r="7" />
          {kind === "done" ? <path d="M4.8 8.2l2.1 2.1 4.3-4.5" /> : null}
        </>
      )}
    </svg>
  );
}

/** A file as the editor shows it: numbered lines, coloured tokens. */
function Code({ source, label, locked }: { source: string; label: string; locked: boolean }) {
  return (
    <pre className={cx(styles.code, locked && styles.codeLocked)} tabIndex={0} role="region" aria-label={label}>
      <code>
        {source.split("\n").map((line, i) => (
          <span key={i} className={styles.codeLine}>
            {line.length === 0
              ? " "
              : tokenizePython(line).map((t, j) =>
                  t.kind ? (
                    <span key={j} className={styles[t.kind]}>
                      {t.text}
                    </span>
                  ) : (
                    <React.Fragment key={j}>{t.text}</React.Fragment>
                  ),
                )}
          </span>
        ))}
      </code>
    </pre>
  );
}

function FileTab({ name }: { name: string }) {
  return (
    <div className={styles.fileTab}>
      <span>{name}</span>
    </div>
  );
}

function TutorPanel() {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  // Open on the newest turn, the way the live panel does.
  React.useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  return (
    <>
      <div className={styles.status}>
        <ol className={styles.phases} role="list">
          {productDemo.phases.map((phase) => (
            <li key={phase.label} className={phase.done ? styles.done : styles.now}>
              <Glyph kind={phase.done ? "done" : "now"} />
              {phase.label}
              <span className="visually-hidden">{phase.done ? productDemo.phaseDone : productDemo.phaseNow}</span>
            </li>
          ))}
        </ol>
        <p className={styles.stat}>
          <strong>{productDemo.stats.hints}</strong> {productDemo.stats.hintsLabel}
        </p>
        <p className={styles.stat}>
          <Glyph kind="time" />
          <strong>{productDemo.stats.time}</strong>
        </p>
      </div>
      <div ref={scrollRef} className={styles.scroll} tabIndex={0} role="region" aria-label={productDemo.chatLabel}>
        <ol className={styles.chat} role="list">
          {productDemo.chat.map((turn, i) => (
            <li key={i} className={turn.who === "You" ? styles.you : styles.tutor}>
              <p className={styles.who}>{turn.who}</p>
              <p className={styles.said}>{turn.said}</p>
            </li>
          ))}
        </ol>
      </div>
      <div className={styles.composer}>
        <span className={styles.field} aria-hidden="true">
          {productDemo.composer.placeholder}
        </span>
        <button type="button" className={cx(styles.btn, styles.btnPrimary)} disabled>
          {productDemo.composer.send}
        </button>
      </div>
    </>
  );
}

function InstructionsPanel() {
  const { instructions, bar } = productDemo;
  return (
    <>
      <div className={styles.proseHead}>
        <p className={styles.proseTitle}>{bar.title}</p>
        <span className={styles.tag}>{bar.difficulty}</span>
      </div>
      {instructions.paragraphs.map((paragraph, i) => (
        <p key={i}>
          {paragraph.map((piece, j) =>
            typeof piece === "string" ? (
              <React.Fragment key={j}>{piece}</React.Fragment>
            ) : "code" in piece ? (
              <code key={j}>{piece.code}</code>
            ) : (
              <strong key={j}>{piece.strong}</strong>
            ),
          )}
        </p>
      ))}
      <p className={styles.sub}>{instructions.exampleHeading}</p>
      <pre className={styles.block}>
        <code>
          {instructions.example.split("\n").map((line, i) => (
            <React.Fragment key={i}>
              {i > 0 ? "\n" : null}
              {line.startsWith("#") ? <span className={styles.c}>{line}</span> : line}
            </React.Fragment>
          ))}
        </code>
      </pre>
      <p className={styles.sub}>{instructions.constraintsHeading}</p>
      <ul className={styles.constraints} role="list">
        {instructions.constraints.map((c) => (
          <li key={c}>
            <code>{c}</code>
          </li>
        ))}
      </ul>
    </>
  );
}

function ResultsPanel() {
  const { results } = productDemo;
  return (
    <>
      <p className={styles.resultsHead}>
        <Glyph kind="done" />
        {results.heading}
      </p>
      <dl className={styles.results}>
        {results.rows.map((row) => (
          <div key={row.label}>
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
      <p className={styles.note}>{results.note}</p>
    </>
  );
}

export function Workspace({ className }: { className?: string }) {
  const base = React.useId();
  const [selected, setSelected] = React.useState(0);
  // False on the server and on the first client render, so both render every
  // panel (the no-script view); true once the tabs are live. The tabs show only
  // under `html.js` (CSS), so they take over only then: never hide a panel
  // without a tab to bring it back. Set on the root as `data-ready`, which the
  // CSS reads for both fragments.
  const [ready, setReady] = React.useState(false);
  React.useEffect(() => setReady(document.documentElement.classList.contains("js")), []);
  const tabRefs = React.useRef<(HTMLButtonElement | null)[]>([]);

  const show = (i: number, focus: boolean) => {
    setSelected(i);
    if (focus) tabRefs.current[i]?.focus();
  };

  const onKeyDown = (event: React.KeyboardEvent, i: number) => {
    const n = TABS.length;
    const to = { ArrowRight: (i + 1) % n, ArrowLeft: (i - 1 + n) % n, Home: 0, End: n - 1 }[event.key];
    if (to === undefined) return;
    event.preventDefault();
    show(to, true);
  };

  const tabId = (key: string) => `${base}-tab-${key}`;
  const panelId = (key: string) => `${base}-panel-${key}`;

  const panels: Record<(typeof TABS)[number]["key"], { body: React.ReactNode; className: string; focusable: boolean }> = {
    tutor: { body: <TutorPanel />, className: styles.tutorPanel, focusable: false },
    instructions: { body: <InstructionsPanel />, className: styles.prose, focusable: true },
    tests: {
      body: (
        <>
          <FileTab name={productDemo.testsFile} />
          <Code source={productDemo.tests} label={productDemo.testsFile} locked />
        </>
      ),
      className: styles.filePane,
      focusable: false,
    },
    results: { body: <ResultsPanel />, className: styles.prose, focusable: true },
  };

  return (
    <div className={cx(styles.workspace, className)} data-cross="block" data-ready={ready ? "" : undefined}>
      <div
        className={cx(styles.fragment, styles.editor, motionStyles.reveal)}
        data-ui=""
        role="group"
        aria-label={productDemo.editorLabel}
      >
        <div className={styles.bar}>
          <span className={styles.lang}>{productDemo.bar.language}</span>
          <span className={styles.title}>{productDemo.bar.title}</span>
          <span className={styles.tag}>{productDemo.bar.difficulty}</span>
          <span className={styles.credits}>
            <strong>{productDemo.bar.credits}</strong> {productDemo.bar.creditsLabel}
          </span>
        </div>
        <FileTab name={productDemo.solutionFile} />
        <Code source={productDemo.solution} label={productDemo.solutionFile} locked={false} />
        <div className={styles.actions}>
          <button type="button" className={styles.btn} disabled>
            {productDemo.actions.run} <kbd>{productDemo.actions.runKeys}</kbd>
          </button>
          <button type="button" className={cx(styles.btn, styles.btnPrimary)} disabled>
            {productDemo.actions.submit} <kbd>{productDemo.actions.submitKeys}</kbd>
          </button>
        </div>
      </div>

      <div
        className={cx(styles.fragment, styles.pane, motionStyles.reveal)}
        // The stagger index travels as data (DESIGN-RULES.md §1's carve-out).
        style={{ "--i": 1 } as React.CSSProperties}
        data-ui=""
      >
        <div className={styles.tabs} role="tablist" aria-label={productDemo.tabsLabel}>
          {TABS.map((tab, i) => (
            <button
              key={tab.key}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={tabId(tab.key)}
              aria-controls={panelId(tab.key)}
              aria-selected={i === selected}
              tabIndex={i === selected ? 0 : -1}
              className={styles.tab}
              onClick={() => show(i, false)}
              onKeyDown={(event) => onKeyDown(event, i)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {TABS.map((tab, i) => {
          const panel = panels[tab.key];
          return (
            // A tab panel only once there are tabs: until then (and always
            // without script) a plain block under its visible name, so nothing
            // points at a tab that is not there (ADR-032).
            <div
              key={tab.key}
              className={cx(styles.panel, panel.className)}
              id={panelId(tab.key)}
              role={ready ? "tabpanel" : undefined}
              aria-labelledby={ready ? tabId(tab.key) : undefined}
              hidden={ready ? i !== selected : undefined}
              tabIndex={ready && panel.focusable ? 0 : undefined}
            >
              <p className={styles.nojsLabel}>{tab.label}</p>
              {panel.body}
            </div>
          );
        })}
      </div>
    </div>
  );
}
