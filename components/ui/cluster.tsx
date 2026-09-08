import type * as React from "react";
import { cx, type ClassValue } from "@/lib/cx";

/**
 * A row of naturally-sized items that wraps: tags, a pair of actions.
 *
 * Not a Carbon `Grid` of `Column`s — a grid column grows to fill its track,
 * which is right for a layout grid and wrong for a tag list, where it spreads
 * four tags across 1200px. Carbon's `Stack` is one-directional and does not
 * wrap. One rule in `styles/_site.scss`, built from Carbon's spacing scale
 * (plan §4.1: "keep as site CSS — no Carbon equivalent").
 */
export function Cluster({
  gap = "small",
  className,
  children,
}: {
  gap?: "small" | "medium";
  className?: ClassValue;
  children: React.ReactNode;
}) {
  return (
    <div className={cx("site-cluster", gap === "medium" && "site-cluster_medium", className)}>
      {children}
    </div>
  );
}
