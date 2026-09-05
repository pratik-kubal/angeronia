"use client";

import * as React from "react";
import { FormElement, fieldWiring } from "@/components/slds/form-element";
import { cx, type ClassValue } from "@/lib/slds/cx";

/**
 * The SLDS 2 Input blueprint, wrapped in a Form Element.
 *
 * `label` is required and always rendered — `hideLabel` moves it to assistive
 * text rather than removing it. A placeholder is not a label: it disappears on
 * first keystroke, which is exactly when it is still needed.
 */
export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "className" | "id" | "required"> {
  label: string;
  help?: string;
  error?: string;
  required?: boolean;
  hideLabel?: boolean;
  horizontal?: boolean;
  className?: ClassValue;
  fieldClassName?: ClassValue;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, help, error, required, hideLabel, horizontal, className, fieldClassName, type = "text", ...rest },
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
      horizontal={horizontal}
      className={fieldClassName}
    >
      <input
        {...rest}
        ref={ref}
        id={wiring.controlId}
        type={type}
        required={required}
        aria-describedby={wiring.describedBy}
        aria-invalid={wiring.invalid || undefined}
        className={cx("slds-input", className)}
      />
    </FormElement>
  );
});
