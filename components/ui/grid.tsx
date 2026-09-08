import type * as React from "react";
import { GridSettings } from "@carbon/react";
import { cx, type ClassValue } from "@/lib/cx";

/**
 * Carbon's 2x grid, in CSS Grid mode.
 *
 * `@carbon/react`'s own `Grid` dispatches on the `enable-css-grid` feature
 * flag and renders the legacy **flexbox** grid when it is off — which it is by
 * default in v11. That path is not an option here: it needs a `<Row>` layer
 * this site has no use for, and `styles/_config.scss` sets
 * `$use-flexbox-grid: false`, so its stylesheet is not even emitted.
 *
 * Turning the flag on has no non-deprecated API in v11 — `FeatureFlags` grew
 * boolean props for every other flag but not this one, leaving only the
 * deprecated `flags` map or a `CARBON_ENABLE_CSS_GRID` environment variable
 * that would have to be threaded through Next, Vite and Vitest alike.
 *
 * So this renders what Carbon's own `CSSGrid` renders, from the exports Carbon
 * actually publishes: `GridSettings` in `css-grid` mode, which is the only
 * thing `Column` reads to decide which set of classes to emit. No flag, no
 * deprecated prop, and `Column` behaves exactly as documented. In v12, where
 * CSS grid is the default, this file collapses back to `Grid` from
 * `@carbon/react`. See DECISIONS.md ADR-016.
 */
export interface GridProps {
  /** Drop the maximum width, so the grid fills its parent. */
  fullWidth?: boolean;
  /** Collapse the gutter to 1px. */
  condensed?: boolean;
  className?: ClassValue;
  children: React.ReactNode;
}

export function Grid({ fullWidth, condensed, className, children }: GridProps) {
  return (
    <GridSettings mode="css-grid" subgrid>
      <div
        className={cx(
          "cds--css-grid",
          fullWidth && "cds--css-grid--full-width",
          condensed && "cds--css-grid--condensed",
          className,
        )}
      >
        {children}
      </div>
    </GridSettings>
  );
}
