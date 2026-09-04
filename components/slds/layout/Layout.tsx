import type * as React from "react";
import { cx, type ClassValue } from "@/lib/slds/cx";

/**
 * Thin wrappers over SLDS 2's grid, container and box utilities.
 *
 * These exist so a page reads as structure rather than as a class-name string,
 * and so the handful of utility combinations this site actually uses are named
 * once. Anything they cannot express is written as utility classes directly —
 * that is rung 3 of the selection ladder, not a failure of rung 1.
 */

type Gutter = "small" | "medium" | "large" | "x-large";

export interface GridProps {
  /** Let columns wrap onto new rows. */
  wrap?: boolean;
  /** Horizontal distribution. */
  align?: "center" | "end" | "space" | "spread";
  /** Vertical alignment of the row. */
  verticalAlign?: "start" | "center" | "end";
  /** Stack vertically instead of horizontally. */
  vertical?: boolean;
  gutters?: Gutter | true;
  className?: ClassValue;
  children: React.ReactNode;
}

export function Grid({
  wrap,
  align,
  verticalAlign,
  vertical,
  gutters,
  className,
  children,
}: GridProps) {
  return (
    <div
      className={cx(
        "slds-grid",
        wrap && "slds-wrap",
        vertical && "slds-grid_vertical",
        align && `slds-grid_align-${align}`,
        verticalAlign && `slds-grid_vertical-align-${verticalAlign}`,
        gutters === true ? "slds-gutters" : gutters && `slds-gutters_${gutters}`,
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Twelfths at each breakpoint. Omit a breakpoint to inherit the smaller one. */
export interface ColProps {
  /** Columns out of 12, at the smallest breakpoint. */
  size?: number;
  /** Columns out of 12, from the medium breakpoint up. */
  medium?: number;
  /** Columns out of 12, from the large breakpoint up. */
  large?: number;
  className?: ClassValue;
  children: React.ReactNode;
}

export function Col({ size, medium, large, className, children }: ColProps) {
  return (
    <div
      className={cx(
        "slds-col",
        size && `slds-size_${size}-of-12`,
        medium && `slds-medium-size_${medium}-of-12`,
        large && `slds-large-size_${large}-of-12`,
        className,
      )}
    >
      {children}
    </div>
  );
}

export interface ContainerProps {
  size?: "small" | "medium" | "large" | "x-large";
  /** Centre the container in its parent. */
  center?: boolean;
  className?: ClassValue;
  children: React.ReactNode;
}

export function Container({ size = "x-large", center = true, className, children }: ContainerProps) {
  return (
    <div
      className={cx(
        `slds-container_${size}`,
        center && "slds-container_center",
        "site-container",
        className,
      )}
    >
      {children}
    </div>
  );
}

export interface BoxProps {
  padding?: "default" | "small" | "x-small" | "xx-small";
  /** `shade` gives the box its own ground; `default` inherits the surface. */
  theme?: "default" | "shade" | "inverse";
  className?: ClassValue;
  children: React.ReactNode;
}

const BOX_PADDING: Record<NonNullable<BoxProps["padding"]>, string | null> = {
  default: null,
  small: "slds-box_small",
  "x-small": "slds-box_x-small",
  "xx-small": "slds-box_xx-small",
};

export function Box({ padding = "default", theme, className, children }: BoxProps) {
  return (
    <div
      className={cx("slds-box", BOX_PADDING[padding], theme && `slds-theme_${theme}`, className)}
    >
      {children}
    </div>
  );
}
