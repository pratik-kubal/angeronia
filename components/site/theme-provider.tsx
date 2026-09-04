"use client";

import type * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { COLOR_SCHEMES, COLOR_SCHEME_CLASS, DEFAULT_COLOR_SCHEME } from "@/lib/slds/scheme";

/**
 * Wires `next-themes` to SLDS 2's colour-scheme classes.
 *
 * `attribute="class"` plus `value` makes next-themes write
 * `slds-color-scheme_light | _dark | _system` on `<html>` instead of its own
 * names, so the design system's `darkMode` utility does the actual work and
 * nothing else in the app needs to know a scheme exists.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      themes={[...COLOR_SCHEMES]}
      value={COLOR_SCHEME_CLASS}
      defaultTheme={DEFAULT_COLOR_SCHEME}
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
