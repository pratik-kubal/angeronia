"use client";

import * as React from "react";
import { cx, type ClassValue } from "@/lib/slds/cx";

export interface RadioOption {
  value: string;
  label: string;
  disabled?: boolean;
}

/**
 * The SLDS 2 Radio Group blueprint.
 *
 * A `<fieldset>` with a `<legend>`, not a labelled `<div>`: the group's
 * question is what a screen reader announces before each option, and only a
 * legend does that. Native radios keep arrow-key navigation and the roving
 * tab stop for free.
 */
export interface RadioGroupProps {
  legend: string;
  name: string;
  options: RadioOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  required?: boolean;
  help?: string;
  error?: string;
  className?: ClassValue;
}

export function RadioGroup({
  legend,
  name,
  options,
  value,
  defaultValue,
  onChange,
  required,
  help,
  error,
  className,
}: RadioGroupProps) {
  const id = React.useId();
  const helpId = `${id}-help`;

  return (
    <fieldset
      className={cx("slds-form-element", error && "slds-has-error", className)}
      aria-describedby={help || error ? helpId : undefined}
    >
      <legend className="slds-form-element__legend slds-form-element__label">
        {required ? (
          <abbr className="slds-required" title="required">
            *
          </abbr>
        ) : null}
        {legend}
      </legend>
      <div className="slds-form-element__control">
        {options.map((option) => {
          const optionId = `${id}-${option.value}`;
          return (
            <span key={option.value} className="slds-radio">
              <input
                type="radio"
                id={optionId}
                name={name}
                value={option.value}
                disabled={option.disabled}
                checked={value === undefined ? undefined : value === option.value}
                defaultChecked={value === undefined ? defaultValue === option.value : undefined}
                onChange={(event) => onChange?.(event.target.value)}
              />
              <label className="slds-radio__label" htmlFor={optionId}>
                <span className="slds-radio_faux" />
                <span className="slds-form-element__label">{option.label}</span>
              </label>
            </span>
          );
        })}
      </div>
      {help || error ? (
        <div id={helpId} className="slds-form-element__help" role={error ? "alert" : undefined}>
          {error ?? help}
        </div>
      ) : null}
    </fieldset>
  );
}
