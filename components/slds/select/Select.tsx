"use client";

import * as React from "react";
import { FormElement, fieldWiring } from "@/components/slds/form-element";
import { cx, type ClassValue } from "@/lib/slds/cx";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

/**
 * The SLDS 2 Select blueprint — a real `<select>`.
 *
 * `.slds-select_container` supplies the chevron, so the native control keeps
 * its platform behaviour (typeahead, mobile pickers, keyboard) instead of a
 * listbox re-implementation that would have to earn all of it back.
 */
export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "className" | "id" | "required" | "children"> {
  label: string;
  options: SelectOption[];
  help?: string;
  error?: string;
  required?: boolean;
  hideLabel?: boolean;
  className?: ClassValue;
  fieldClassName?: ClassValue;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, options, help, error, required, hideLabel, className, fieldClassName, ...rest },
  ref,
) {
  const id = React.useId();
  const wiring = fieldWiring(id, { help, error });

  return (
    <FormElement
      label={label}
      controlId={wiring.controlId}
      helpId={wiring.helpId}
      errorId={wiring.errorId}
      required={required}
      help={help}
      error={error}
      hideLabel={hideLabel}
      className={fieldClassName}
    >
      <div className="slds-select_container">
        <select
          {...rest}
          ref={ref}
          id={wiring.controlId}
          required={required}
          aria-describedby={wiring.describedBy}
          aria-invalid={wiring.invalid || undefined}
          className={cx("slds-select", className)}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </FormElement>
  );
});
