"use client";

import type * as React from "react";

/**
 * The `<header>` element. Stub: always stuck. Phase B (B1) adds the sentinel
 * and the observer that set `data-stuck` once the page has scrolled.
 */
export function HeaderState({
  className,
  children,
}: {
  variant: "overlay" | "solid";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <header className={className} data-stuck="true">
      {children}
    </header>
  );
}
