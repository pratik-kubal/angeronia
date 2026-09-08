"use client";

import type * as React from "react";
import { Close, Information, WarningAlt, CheckmarkFilled, ErrorFilled } from "@carbon/icons-react";
import type { CarbonIconType } from "@carbon/icons-react";
import { cx, type ClassValue } from "@/lib/slds/cx";

/**
 * The SLDS 2 Toast blueprint — a transient message about the page.
 *
 * Deliberately not auto-dismissing. A message worth interrupting for is worth
 * leaving on screen until it is read, and a timed dismissal fails WCAG 2.2.1
 * for anyone who reads slowly or is using a screen reader.
 */

export type ToastTone = "info" | "success" | "warning" | "error";

const ICON: Record<ToastTone, CarbonIconType> = {
  info: Information,
  success: CheckmarkFilled,
  warning: WarningAlt,
  error: ErrorFilled,
};

const TONE_CLASS: Record<ToastTone, string | null> = {
  info: "slds-theme_info",
  success: "slds-theme_success",
  warning: "slds-theme_warning",
  error: "slds-theme_error",
};

const TONE_WORD: Record<ToastTone, string> = {
  info: "Note",
  success: "Success",
  warning: "Warning",
  error: "Error",
};

export interface ToastProps {
  tone?: ToastTone;
  onClose?: () => void;
  className?: ClassValue;
  children: React.ReactNode;
}

export function Toast({ tone = "info", onClose, className, children }: ToastProps) {
  const Glyph = ICON[tone];
  const urgent = tone === "error" || tone === "warning";

  return (
    <div className="slds-notify_container slds-is-relative">
      <div
        className={cx("slds-notify slds-notify_toast", TONE_CLASS[tone], className)}
        role={urgent ? "alert" : "status"}
      >
        <span className="slds-assistive-text">{TONE_WORD[tone]}</span>
        <span className="slds-icon_container slds-m-right_small slds-current-color">
          <Glyph className="slds-icon slds-icon_small" size={20} aria-hidden="true" focusable="false" />
        </span>
        <div className="slds-notify__content">
          <h2 className="slds-text-heading_small">{children}</h2>
        </div>
        {onClose ? (
          <button
            type="button"
            className="slds-button slds-button_icon slds-notify__close slds-button_icon-inverse"
            onClick={onClose}
          >
            <Close className="slds-button__icon" size={16} aria-hidden="true" focusable="false" />
            <span className="slds-assistive-text">Close</span>
          </button>
        ) : null}
      </div>
    </div>
  );
}
