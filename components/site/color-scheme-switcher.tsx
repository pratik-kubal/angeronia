"use client";

import * as React from "react";
import { Sun, Moon, Laptop } from "@carbon/icons-react";
import { useTheme } from "next-themes";
import { ButtonGroup } from "@/components/slds/button-group";
import { ButtonIcon } from "@/components/slds/button-icon";
import { copy } from "@/data/angeronia";
import { COLOR_SCHEMES, type ColorScheme } from "@/lib/slds/scheme";

const ICON = { light: Sun, dark: Moon, system: Laptop } as const;

/**
 * Light / dark / system, as a group of toggle buttons.
 *
 * A three-way choice with a persistent selection is a set of toggles, not a
 * cycling button: `aria-pressed` says which one is on, so the current scheme is
 * announced rather than inferred from an icon (SLDS Button Groups →
 * Accessibility, design rule 10).
 *
 * Before hydration `resolvedTheme` is unknown, so every button renders
 * unpressed. Rendering a guess instead would announce the wrong state to
 * anyone whose scheme differs from the default.
 */
export function ColorSchemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  return (
    <ButtonGroup label={copy.colorScheme.label}>
      {COLOR_SCHEMES.map((scheme: ColorScheme) => (
        <ButtonIcon
          key={scheme}
          icon={ICON[scheme]}
          assistiveText={copy.colorScheme[scheme]}
          variant="border-filled"
          size="small"
          pressed={mounted ? theme === scheme : false}
          onClick={() => setTheme(scheme)}
        />
      ))}
    </ButtonGroup>
  );
}
