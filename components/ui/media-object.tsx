import type * as React from "react";
import { cx, type ClassValue } from "@/lib/cx";

/**
 * A figure beside a body, stacking below `md`. Carbon has no media object
 * (plan §4.1), so this is one flex rule in `styles/_site.scss`.
 */
export interface MediaObjectProps {
  figure?: React.ReactNode;
  className?: ClassValue;
  children: React.ReactNode;
}

export function MediaObject({ figure, className, children }: MediaObjectProps) {
  return (
    <div className={cx("site-media", className)}>
      {figure ? <div className="site-media__figure">{figure}</div> : null}
      <div className="site-media__body">{children}</div>
    </div>
  );
}
