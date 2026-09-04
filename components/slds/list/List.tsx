import type * as React from "react";
import { cx, type ClassValue } from "@/lib/slds/cx";

/**
 * The SLDS 2 list utilities, as a component.
 *
 * `ordered` decides the element (`<ol>` vs `<ul>`) — the semantics — while
 * `variant` decides the look. A dotted list is still a `<ul>`.
 */

export type ListVariant = "vertical" | "horizontal" | "dotted";

const VARIANT_CLASS: Record<ListVariant, string> = {
  vertical: "slds-list_vertical",
  horizontal: "slds-list_horizontal",
  dotted: "slds-list_dotted",
};

export type ListDividers = "top" | "bottom" | "around" | "top-space" | "bottom-space";

export interface ListProps {
  variant?: ListVariant;
  dividers?: ListDividers;
  /** Use an `<ol>`, for content whose order is part of its meaning. */
  ordered?: boolean;
  className?: ClassValue;
  children: React.ReactNode;
}

export function List({ variant = "vertical", dividers, ordered, className, children }: ListProps) {
  const Tag = ordered ? "ol" : "ul";
  return (
    <Tag
      className={cx(
        VARIANT_CLASS[variant],
        dividers && `slds-has-dividers_${dividers}`,
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export function ListItem({
  className,
  children,
}: {
  className?: ClassValue;
  children: React.ReactNode;
}) {
  return <li className={cx("slds-list__item", className)}>{children}</li>;
}
