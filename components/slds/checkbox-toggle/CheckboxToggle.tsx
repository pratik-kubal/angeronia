"use client";

import * as React from "react";
import { cx, type ClassValue } from "@/lib/slds/cx";

/**
 * The SLDS 2 Checkbox Toggle blueprint — a switch.
 *
 * `onText` / `offText` are rendered next to the track and are not decoration:
 * a switch whose state is carried only by knob position and fill is a
 * colour-and-position-only meaning (design rule 10). SLDS's own blueprint
 * requires them for the same reason.
 */
export interface CheckboxToggleProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "className" | "type"> {
  label: string;
  onText?: string;
  offText?: string;
  help?: string;
  className?: ClassValue;
}

export const CheckboxToggle = React.forwardRef<HTMLInputElement, CheckboxToggleProps>(
  function CheckboxToggle(
    { label, onText = "Enabled", offText = "Disabled", help, className, ...rest },
    ref,
  ) {
    const id = React.useId();
    const helpId = `${id}-help`;

    return (
      <div className={cx("slds-form-element", className)}>
        <label className="slds-checkbox_toggle slds-grid" htmlFor={id}>
          <span className="slds-form-element__label slds-m-bottom_none">{label}</span>
          <input
            {...rest}
            ref={ref}
            type="checkbox"
            id={id}
            aria-describedby={help ? helpId : undefined}
          />
          <span className="slds-checkbox_faux_container" aria-live="assertive">
            <span className="slds-checkbox_faux" />
            <span className="slds-checkbox_on">{onText}</span>
            <span className="slds-checkbox_off">{offText}</span>
          </span>
        </label>
        {help ? (
          <div id={helpId} className="slds-form-element__help">
            {help}
          </div>
        ) : null}
      </div>
    );
  },
);
