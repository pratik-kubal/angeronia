import type * as React from "react";
import { cx, type ClassValue } from "@/lib/slds/cx";

/**
 * The SLDS 2 Form Element blueprint: the label, required marker, help text and
 * error message that wrap every control.
 *
 * Every field in this library composes this rather than repeating the markup,
 * so the wiring that makes a field usable — `for`/`id`, `aria-describedby`,
 * `aria-invalid`, and the fact that the asterisk is announced as "required"
 * rather than read as punctuation — is written once.
 */

export interface FieldWiring {
  /** id for the control itself. */
  controlId: string;
  /** ids of the help and error text, for `aria-describedby`. */
  describedBy: string | undefined;
  invalid: boolean;
}

export interface FormElementProps {
  /** Visible label. Required — a placeholder is not a label. */
  label: string;
  controlId: string;
  helpId: string;
  errorId: string;
  required?: boolean;
  /** Supporting text under the control. */
  help?: string;
  /** Error message. Its presence is what marks the field invalid. */
  error?: string;
  /** Hide the label visually but keep it for assistive technology. */
  hideLabel?: boolean;
  /** `<fieldset>`/`<legend>` instead of `<div>`/`<label>`, for groups. */
  asFieldset?: boolean;
  /** Label and control side by side rather than stacked. */
  horizontal?: boolean;
  className?: ClassValue;
  children: React.ReactNode;
}

export function FormElement({
  label,
  controlId,
  helpId,
  errorId,
  required,
  help,
  error,
  hideLabel,
  asFieldset,
  horizontal,
  className,
  children,
}: FormElementProps) {
  const Root = asFieldset ? "fieldset" : "div";
  const Label = asFieldset ? "legend" : "label";

  return (
    <Root
      className={cx(
        "slds-form-element",
        horizontal && "slds-form-element_horizontal",
        error && "slds-has-error",
        className,
      )}
    >
      <Label
        className={cx(
          asFieldset ? "slds-form-element__legend slds-form-element__label" : "slds-form-element__label",
          hideLabel && "slds-assistive-text",
        )}
        htmlFor={asFieldset ? undefined : controlId}
      >
        {required ? (
          <abbr className="slds-required" title="required">
            *
          </abbr>
        ) : null}
        {label}
      </Label>
      <div className="slds-form-element__control">{children}</div>
      {help ? (
        <div id={helpId} className="slds-form-element__help">
          {help}
        </div>
      ) : null}
      {error ? (
        <div id={errorId} className="slds-form-element__help" role="alert">
          {error}
        </div>
      ) : null}
    </Root>
  );
}

/** The ids and ARIA a field needs, derived from one `useId` value. */
export function fieldWiring(
  id: string,
  { help, error }: { help?: string; error?: string },
): FieldWiring & { helpId: string; errorId: string } {
  const helpId = `${id}-help`;
  const errorId = `${id}-error`;
  const described = [help ? helpId : null, error ? errorId : null].filter(Boolean);

  return {
    controlId: id,
    helpId,
    errorId,
    describedBy: described.length ? described.join(" ") : undefined,
    invalid: Boolean(error),
  };
}
