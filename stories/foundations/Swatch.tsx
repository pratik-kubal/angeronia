import type * as React from "react";
import { contrast, token } from "./tokens";

/**
 * Presentational pieces shared by the Foundations boards.
 *
 * Deliberately plain: these describe the design system rather than being part
 * of it, so they use `--cds-*` tokens for their own chrome and nothing else.
 */

/** A colour chip with its token name and resolved value beside it. */
export function Swatch({ name, label }: { name: string; label?: string }) {
  const value = token(name);
  return (
    <div className="sb-swatch">
      <span className="sb-swatch__chip" style={{ background: `var(${name})` }} aria-hidden="true" />
      <span className="sb-swatch__meta">
        <code className="sb-mono">{label ?? name.replace("--cds-", "")}</code>
        <span className="sb-quiet site-body_small">{value || "—"}</span>
      </span>
    </div>
  );
}

/** A ground with its paired ink written on it, plus the ratio. */
export function Pairing({
  on,
  container,
  min = 4.5,
}: {
  on: string;
  container: string;
  /** 4.5 for text, 3 for a non-text boundary — WCAG 1.4.3 vs 1.4.11. */
  min?: number;
}) {
  const ratio = typeof document === "undefined" ? 0 : contrast(token(on), token(container));
  const pass = ratio >= min;

  return (
    <div className="sb-pairing">
      <div
        className="sb-pairing__sample"
        style={{ background: `var(${container})`, color: `var(${on})` }}
      >
        The quick brown fox
      </div>
      <p className="site-body_small">
        <code className="sb-mono">{on.replace("--cds-", "")}</code> on{" "}
        <code className="sb-mono">{container.replace("--cds-", "")}</code>
        {" — "}
        <strong>{ratio.toFixed(2)}:1</strong> {pass ? `(passes ${min}:1)` : `(below ${min}:1)`}
      </p>
    </div>
  );
}

/** A labelled row of examples. */
export function Board({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="sb-board">
      <h3 className="sb-board__title">{title}</h3>
      {children}
    </section>
  );
}
