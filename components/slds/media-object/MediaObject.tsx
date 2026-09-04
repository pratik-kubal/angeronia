import type * as React from "react";
import { cx, type ClassValue } from "@/lib/slds/cx";

/**
 * The SLDS 2 Media Object utility: a figure beside a body, with the two kept
 * on one baseline and the body free to truncate.
 */
export interface MediaObjectProps {
  figure?: React.ReactNode;
  /** Align figure and body on their centres rather than their tops. */
  center?: boolean;
  /** Stack the figure above the body on small screens. */
  responsive?: boolean;
  className?: ClassValue;
  children: React.ReactNode;
}

export function MediaObject({
  figure,
  center,
  responsive,
  className,
  children,
}: MediaObjectProps) {
  return (
    <div
      className={cx(
        "slds-media",
        center && "slds-media_center",
        responsive && "slds-media_responsive",
        className,
      )}
    >
      {figure ? <div className="slds-media__figure">{figure}</div> : null}
      <div className="slds-media__body">{children}</div>
    </div>
  );
}
