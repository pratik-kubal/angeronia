"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { THEME_OPTIONS, type Theme } from "@/data/angeronia";

// 3-segment Light / Dark / Noir control. Drives next-themes (data-theme on <html>).
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Before mount, reflect the SSR default (light) so markup matches — no flash.
  const active = (mounted ? (theme as Theme) : "light") ?? "light";

  return (
    <div className="ang-toggle" role="group" aria-label="Theme mode">
      {THEME_OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={active === o.value}
          onClick={() => setTheme(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
