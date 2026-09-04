import * as React from "react";
import type { CarbonIconType } from "@carbon/icons-react";
import { cx, type ClassValue } from "@/lib/slds/cx";

/**
 * The SLDS 2 Button Icon blueprint — a button whose only content is a glyph.
 *
 * `assistiveText` is required, not optional: an icon-only control has no
 * visible name, so the accessible name has to come from somewhere. It is
 * rendered as `slds-assistive-text` inside the button, which names the control
 * without a tooltip's hover-only discoverability.
 */

export type ButtonIconVariant =
  | "bare"
  | "container"
  | "border"
  | "border-filled"
  | "border-inverse"
  | "brand"
  | "inverse";

const VARIANT_CLASS: Record<ButtonIconVariant, string> = {
  bare: "slds-button_icon-bare",
  container: "slds-button_icon-container",
  border: "slds-button_icon-border",
  "border-filled": "slds-button_icon-border-filled",
  "border-inverse": "slds-button_icon-border-inverse",
  brand: "slds-button_icon-brand",
  inverse: "slds-button_icon-inverse",
};

export type ButtonIconSize = "xx-small" | "x-small" | "small" | "medium" | "large";

const SIZE_CLASS: Record<ButtonIconSize, string | null> = {
  "xx-small": "slds-button_icon-xx-small",
  "x-small": "slds-button_icon-x-small",
  small: "slds-button_icon-small",
  medium: null,
  large: "slds-button_icon-large",
};

export interface ButtonIconProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> {
  icon: CarbonIconType;
  /** The control's accessible name. Required — there is no visible label. */
  assistiveText: string;
  variant?: ButtonIconVariant;
  size?: ButtonIconSize;
  /** Toggle state. Sets `aria-pressed` and the stateful icon class. */
  pressed?: boolean;
  className?: ClassValue;
}

export const ButtonIcon = React.forwardRef<HTMLButtonElement, ButtonIconProps>(function ButtonIcon(
  {
    icon: Glyph,
    assistiveText,
    variant = "border",
    size = "medium",
    pressed,
    className,
    type = "button",
    ...rest
  },
  ref,
) {
  return (
    <button
      {...rest}
      ref={ref}
      type={type}
      aria-pressed={pressed}
      className={cx(
        "slds-button",
        "slds-button_icon",
        VARIANT_CLASS[variant],
        SIZE_CLASS[size],
        className,
      )}
    >
      <Glyph
        className={cx("slds-button__icon", pressed !== undefined && "slds-button__icon_stateful")}
        size={16}
        aria-hidden="true"
        focusable="false"
      />
      <span className="slds-assistive-text">{assistiveText}</span>
    </button>
  );
});
