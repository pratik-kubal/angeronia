"use client";

import type * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import {
  COLOR_SCHEMES,
  COLOR_SCHEME_ATTRIBUTE,
  DEFAULT_COLOR_SCHEME,
} from "@/lib/theme";

/**
 * Wires `next-themes` to Carbon's themes.
 *
 * `attribute="data-theme"` makes next-themes write `data-theme="light" | "dark"`
 * on `<html>`, which is the selector `styles/_themes.scss` keys both Carbon
 * token sets off. With `enableSystem`, `system` resolves to one of the two
 * before it is written, so the attribute always names a real theme and CSS
 * never has to reason about "system".
 *
 * The provider also injects a head script that paints the attribute before
 * hydration, so there is no flash of the wrong scheme.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute={COLOR_SCHEME_ATTRIBUTE}
      themes={[...COLOR_SCHEMES]}
      defaultTheme={DEFAULT_COLOR_SCHEME}
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
