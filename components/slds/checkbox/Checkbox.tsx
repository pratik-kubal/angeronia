"use client";

import * as React from "react";
import { cx, type ClassValue } from "@/lib/slds/cx";

/**
 * The SLDS 2 Checkbox blueprint.
 *
 * The real `<input type="checkbox">` stays in the DOM and keeps every keyboard
 * and assistive-technology behaviour; `.slds-checkbox_faux` is the box you see.
 * The label wraps both, so clicking the text toggles the control without
 * needing `for`/`id` to be right.
 */
export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "className" | "type"> {
  label: string;
  /** Supporting text under the control. */
  help?: string;
  error?: string;
  className?: ClassValue;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, help, error, className, ...rest },
  ref,
) {
  const id = React.useId();
  const helpId = `${id}-help`;

  return (
    <div className={cx("slds-form-element", error && "slds-has-error", className)}>
      <div className="slds-form-element__control">
        <div className="slds-checkbox">
          <input
            {...rest}
            ref={ref}
            type="checkbox"
            id={id}
            aria-describedby={help || error ? helpId : undefined}
            aria-invalid={error ? true : undefined}
          />
          <label className="slds-checkbox__label" htmlFor={id}>
            <span className="slds-checkbox_faux" />
            <span className="slds-form-element__label">{label}</span>
          </label>
        </div>
      </div>
      {help || error ? (
        <div id={helpId} className="slds-form-element__help" role={error ? "alert" : undefined}>
          {error ?? help}
        </div>
      ) : null}
    </div>
  );
});
