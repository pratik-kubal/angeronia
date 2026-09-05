import type * as React from "react";
import { Information, WarningAlt, CheckmarkFilled, ErrorFilled } from "@carbon/icons-react";
import type { CarbonIconType } from "@carbon/icons-react";
import { cx, type ClassValue } from "@/lib/slds/cx";

/**
 * The SLDS 2 Scoped Notification blueprint — an inline message about the
 * region it sits in, as opposed to a Toast, which is about the page.
 *
 * The icon and the word in front of the message do the work colour cannot: a
 * red bar is not a message (design rule 10). `role="alert"` is reserved for
 * `error` and `warning`, because it interrupts a screen reader mid-sentence
 * and an informational note does not deserve that.
 */

export type AlertTone = "info" | "success" | "warning" | "error";

const ICON: Record<AlertTone, CarbonIconType> = {
  info: Information,
  success: CheckmarkFilled,
  warning: WarningAlt,
  error: ErrorFilled,
};

const TONE_CLASS: Record<AlertTone, string | null> = {
  info: null,
  success: "slds-theme_success",
  warning: "slds-theme_warning",
  error: "slds-theme_error",
};

/** Announced before the message, so the tone is never colour-only. */
const TONE_WORD: Record<AlertTone, string> = {
  info: "Note",
  success: "Success",
  warning: "Warning",
  error: "Error",
};

export interface AlertProps {
  tone?: AlertTone;
  className?: ClassValue;
  children: React.ReactNode;
}

export function Alert({ tone = "info", className, children }: AlertProps) {
  const Glyph = ICON[tone];
  const urgent = tone === "error" || tone === "warning";

  return (
    <div
      className={cx("slds-scoped-notification slds-media", TONE_CLASS[tone], className)}
      role={urgent ? "alert" : "status"}
    >
      <div className="slds-media__figure">
        <span className="slds-icon_container slds-current-color">
          <Glyph
            className="slds-icon slds-icon_small"
            size={20}
            aria-hidden="true"
            focusable="false"
          />
        </span>
      </div>
      <div className="slds-media__body">
        <span className="slds-assistive-text">{`${TONE_WORD[tone]}: `}</span>
        <strong>{TONE_WORD[tone]}</strong> — {children}
      </div>
    </div>
  );
}
