"use client";

import * as React from "react";
import { Sun, Moon } from "@carbon/icons-react";
import { IconButton } from "@carbon/react";
import { useTheme } from "next-themes";
import { copy } from "@/data/angeronia";
import { SELECTABLE_COLOR_SCHEMES, type SelectableColorScheme } from "@/lib/theme";

const ICON = { light: Sun, dark: Moon } as const;

/**
 * Light / dark, as a pair of toggle buttons.
 *
 * A choice with a persistent selection is a set of toggles, not a cycling
 * button: `aria-pressed` says which one is on, so the current scheme is
 * announced rather than inferred from an icon (design rule 10). Carbon's
 * `IconButton` also names the control visibly on hover and focus through its
 * own tooltip, which the SLDS version could only do with assistive text.
 *
 * A plain `role="group"` rather than Carbon's `ButtonSet`: `.cds--btn-set` puts
 * `inline-size: 100%` on every descendant `.cds--btn`, which is right for a pair
 * of full-width form actions and wrong for two 32px toggles — and `IconButton`
 * nests its button inside a tooltip trigger, so the rule reaches it anyway.
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
    <div role="group" aria-label={copy.colorScheme.label} className="site-scheme-switch">
      {SELECTABLE_COLOR_SCHEMES.map((scheme: SelectableColorScheme) => {
        const Glyph = ICON[scheme];
        const pressed = mounted ? resolvedTheme === scheme : false;
        return (
          <IconButton
            key={scheme}
            kind="ghost"
            size="sm"
            label={copy.colorScheme[scheme]}
            aria-pressed={pressed}
            isSelected={pressed}
            onClick={() => setTheme(scheme)}
          >
            <Glyph size={16} aria-hidden="true" focusable="false" />
          </IconButton>
        );
      })}
    </div>
  );
}
