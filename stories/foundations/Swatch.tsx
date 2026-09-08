import type * as React from "react";
import { contrast, hook } from "./tokens";

/**
 * Presentational pieces shared by the Foundations boards.
 *
 * Deliberately plain: these describe the design system rather than being part
 * of it, so they use `--slds-*` hooks for their own chrome and nothing else.
 */

/** A colour chip with its hook name and resolved value beside it. */
export function Swatch({ name, label }: { name: string; label?: string }) {
  const value = hook(name);
  return (
    <div className="sb-swatch">
      <span className="sb-swatch__chip" style={{ background: `var(${name})` }} aria-hidden="true" />
      <span className="sb-swatch__meta">
        <code className="slds-text-font_monospace">{label ?? name.replace("--slds-g-color-", "")}</code>
        <span className="slds-text-body_small slds-text-color_weak">{value || "—"}</span>
      </span>
    </div>
  );
}

/** A container colour with its paired `on-*` ink written on it, plus the ratio. */
export function Pairing({ on, container }: { on: string; container: string }) {
  const ratio = typeof document === "undefined" ? 0 : contrast(hook(on), hook(container));
  const pass = ratio >= 4.5;

  return (
    <div className="sb-pairing">
      <div
        className="sb-pairing__sample"
        style={{ background: `var(${container})`, color: `var(${on})` }}
      >
        The quick brown fox
      </div>
      <p className="slds-text-body_small">
        <code className="slds-text-font_monospace">{on.replace("--slds-g-color-", "")}</code> on{" "}
        <code className="slds-text-font_monospace">{container.replace("--slds-g-color-", "")}</code>
        {" — "}
        <strong>{ratio.toFixed(2)}:1</strong> {pass ? "(AA)" : "(below AA)"}
      </p>
    </div>
  );
}

/** A labelled row of examples. */
export function Board({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="slds-m-bottom_x-large">
      <h3 className="slds-text-heading_small slds-m-bottom_small">{title}</h3>
      {children}
    </section>
  );
}
