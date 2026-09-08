"use client";

import * as React from "react";
import { FormElement, fieldWiring } from "@/components/slds/form-element";
import { cx, type ClassValue } from "@/lib/slds/cx";

/** The SLDS 2 Textarea blueprint, wrapped in a Form Element. */
export interface TextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "className" | "id" | "required"> {
  label: string;
  help?: string;
  error?: string;
  required?: boolean;
  hideLabel?: boolean;
  className?: ClassValue;
  fieldClassName?: ClassValue;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, help, error, required, hideLabel, className, fieldClassName, rows = 4, ...rest },
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
      <textarea
        {...rest}
        ref={ref}
        id={wiring.controlId}
        rows={rows}
        required={required}
        aria-describedby={wiring.describedBy}
        aria-invalid={wiring.invalid || undefined}
        className={cx("slds-textarea", className)}
      />
    </FormElement>
  );
});
