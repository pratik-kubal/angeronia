import * as React from "react";
import type { CarbonIconType } from "@carbon/icons-react";
import { cx, type ClassValue } from "@/lib/slds/cx";

/**
 * The SLDS 2 Button blueprint.
 *
 * Renders a `<button>` by default and an `<a>` when `href` is given, because a
 * control that navigates must be a link — same styling, different semantics,
 * different keyboard contract.
 *
 * Radius, hover lift and focus ring all come from the theme: `.slds-button`
 * resolves its radius through `--slds-c-button-radius-border` →
 * `--slds-s-button-radius-border` → `--slds-g-radius-border-pill`, and the
 * brand variant's hover `translateY(-2px)` is Cosmos's own
 * `--slds-s-button-brand-transform-hover`. Nothing here re-states any of it.
 */

export type ButtonVariant =
  | "base"
  | "neutral"
  | "brand"
  | "outline-brand"
  | "destructive"
  | "text-destructive"
  | "success"
  | "inverse";

const VARIANT_CLASS: Record<ButtonVariant, string | null> = {
  base: null,
  neutral: "slds-button_neutral",
  brand: "slds-button_brand",
  "outline-brand": "slds-button_outline-brand",
  destructive: "slds-button_destructive",
  "text-destructive": "slds-button_text-destructive",
  success: "slds-button_success",
  inverse: "slds-button_inverse",
};

interface ButtonOwnProps {
  variant?: ButtonVariant;
  /** Icon before the label. Decorative: the label already names the action. */
  iconLeft?: CarbonIconType;
  /** Icon after the label. Decorative, as above. */
  iconRight?: CarbonIconType;
  /** Fill the width of the parent. */
  stretch?: boolean;
  className?: ClassValue;
  children: React.ReactNode;
}

type ButtonAsButton = ButtonOwnProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> & {
    href?: never;
  };

type ButtonAsLink = ButtonOwnProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "children"> & {
    href: string;
  };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

/** Icons inside a button repeat the label, so they are always `aria-hidden`. */
function ButtonGlyph({ icon: Glyph, side }: { icon: CarbonIconType; side: "left" | "right" }) {
  return (
    <Glyph
      className={cx("slds-button__icon", `slds-button__icon_${side}`)}
      size={16}
      aria-hidden="true"
      focusable="false"
    />
  );
}

export const Button = React.forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  function Button(
    { variant = "neutral", iconLeft, iconRight, stretch, className, children, ...rest },
    ref,
  ) {
    const classes = cx(
      "slds-button",
      VARIANT_CLASS[variant],
      stretch && "slds-button_stretch",
      className,
    );

    const content = (
      <>
        {iconLeft ? <ButtonGlyph icon={iconLeft} side="left" /> : null}
        {children}
        {iconRight ? <ButtonGlyph icon={iconRight} side="right" /> : null}
      </>
    );

    if ("href" in rest && rest.href !== undefined) {
      const { href, ...anchorProps } = rest as ButtonAsLink;
      return (
        <a
          {...anchorProps}
          href={href}
          className={classes}
          ref={ref as React.Ref<HTMLAnchorElement>}
        >
          {content}
        </a>
      );
    }

    const { type = "button", ...buttonProps } = rest as ButtonAsButton;
    return (
      <button
        {...buttonProps}
        type={type}
        className={classes}
        ref={ref as React.Ref<HTMLButtonElement>}
      >
        {content}
      </button>
    );
  },
);
