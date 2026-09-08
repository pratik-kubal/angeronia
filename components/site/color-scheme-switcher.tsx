"use client";

import * as React from "react";
import { Sun, Moon } from "@carbon/icons-react";
import { useTheme } from "next-themes";
import { ButtonGroup } from "@/components/slds/button-group";
import { ButtonIcon } from "@/components/slds/button-icon";
import { copy } from "@/data/angeronia";
import { SELECTABLE_COLOR_SCHEMES, type SelectableColorScheme } from "@/lib/slds/scheme";

const ICON = { light: Sun, dark: Moon } as const;

/**
 * Light / dark, as a pair of toggle buttons.
 *
 * A choice with a persistent selection is a set of toggles, not a cycling
 * button: `aria-pressed` says which one is on, so the current scheme is
 * announced rather than inferred from an icon (SLDS Button Groups →
 * Accessibility, design rule 10).
 *
 * The pressed state comes from `resolvedTheme`, not `theme`. `system` is still
 * the default scheme — a first visit follows the reader's OS — but it has no
 * button, so reading `theme` would leave both toggles unpressed for everyone
 * who has never picked one. `resolvedTheme` is what they are actually looking
 * at, which is what the control should claim.
 *
 * Before hydration it is unknown, so both render unpressed. Rendering a guess
 * would announce the wrong state to anyone whose scheme differs from the
 * default.
 */
export function ColorSchemeSwitcher() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  return (
    <ButtonGroup label={copy.colorScheme.label}>
      {SELECTABLE_COLOR_SCHEMES.map((scheme: SelectableColorScheme) => (
        <ButtonIcon
          key={scheme}
          icon={ICON[scheme]}
          assistiveText={copy.colorScheme[scheme]}
          variant="border-filled"
          size="small"
          pressed={mounted ? resolvedTheme === scheme : false}
          onClick={() => setTheme(scheme)}
        />
      ))}
    </ButtonGroup>
  );
}
