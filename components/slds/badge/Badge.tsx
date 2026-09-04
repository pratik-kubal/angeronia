import type * as React from "react";
import type { CarbonIconType } from "@carbon/icons-react";
import { cx, type ClassValue } from "@/lib/slds/cx";

/**
 * The SLDS 2 Badge blueprint.
 *
 * A badge labels; a pill is removable. Tags on this site are labels, so they
 * are badges — SLDS Pills → "Badge vs Pill".
 *
 * The `success` / `warning` / `error` variants exist because the blueprint has
 * them, but design rule 4 reserves feedback colour for feedback: a technology
 * tag is `default`, never `success`.
 */

export type BadgeVariant = "default" | "inverse" | "lightest" | "success" | "warning" | "error";

const VARIANT_CLASS: Record<BadgeVariant, string | null> = {
  default: null,
  inverse: "slds-badge_inverse",
  lightest: "slds-badge_lightest",
  success: "slds-theme_success",
  warning: "slds-theme_warning",
  error: "slds-theme_error",
};

export interface BadgeProps {
  variant?: BadgeVariant;
  /** Decorative icon before the label. */
  icon?: CarbonIconType;
  className?: ClassValue;
  children: React.ReactNode;
}

export function Badge({ variant = "default", icon: Glyph, className, children }: BadgeProps) {
  return (
    <span className={cx("slds-badge", VARIANT_CLASS[variant], className)}>
      {Glyph ? (
        <span className="slds-badge__icon slds-badge__icon_left">
          <Glyph className="slds-icon slds-icon_xx-small" size={16} aria-hidden="true" focusable="false" />
        </span>
      ) : null}
      {children}
    </span>
  );
}
