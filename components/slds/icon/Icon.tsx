import type { CarbonIconType } from "@carbon/icons-react";
import { cx, type ClassValue } from "@/lib/slds/cx";

/**
 * An IBM Carbon glyph wearing SLDS 2's icon classes.
 *
 * SLDS 2 ships no icon artwork we are allowed to use (D10), but `.slds-icon`
 * styles *any* inline `<svg>` that carries it — the SVG's origin does not
 * matter. So the sizing, colour and container rules come from the design
 * system and the drawing comes from `@carbon/icons-react` (Apache-2.0).
 *
 * `size` picks both the rendered box (via the SLDS class) and the Carbon glyph
 * grid, so line weights stay optically correct instead of being scaled: Carbon
 * draws separate 16/20/24/32 masters.
 */

export type IconSize = "xx-small" | "x-small" | "small" | "medium" | "large";

/** SLDS class per size. `medium` is `.slds-icon`'s own 2rem default. */
const SIZE_CLASS: Record<IconSize, string | null> = {
  "xx-small": "slds-icon_xx-small",
  "x-small": "slds-icon_x-small",
  small: "slds-icon_small",
  medium: null,
  large: "slds-icon_large",
};

/** Carbon glyph master that matches each SLDS box (plan §2.5). */
const SIZE_GLYPH: Record<IconSize, 16 | 20 | 24 | 32> = {
  "xx-small": 16,
  "x-small": 16,
  small: 24,
  medium: 32,
  large: 32,
};

/**
 * Ink. `current` inherits from the surrounding text, which is what most icons
 * next to a label want; the rest map to SLDS's semantic icon colours.
 */
export type IconTone = "current" | "default" | "weak" | "light" | "error" | "success" | "warning";

const TONE_CLASS: Record<IconTone, string> = {
  current: "slds-current-color",
  default: "slds-icon-text-default",
  weak: "slds-icon-text-weak",
  light: "slds-icon-text-light",
  error: "slds-icon-text-error",
  success: "slds-icon-text-success",
  warning: "slds-icon-text-warning",
};

interface IconBase {
  /** A component from `@carbon/icons-react`, e.g. `ArrowRight`. */
  icon: CarbonIconType;
  size?: IconSize;
  tone?: IconTone;
  className?: ClassValue;
  /** Class for the wrapping `slds-icon_container`. */
  containerClassName?: ClassValue;
}

/**
 * Exactly one of `assistiveText` or `decorative` is required — the SLDS Icons
 * accessibility rule, enforced by the type system rather than by review. An
 * icon either carries meaning and needs a name, or it repeats an adjacent
 * label and must be hidden from assistive technology.
 */
export type IconProps =
  | (IconBase & { assistiveText: string; decorative?: never })
  | (IconBase & { decorative: true; assistiveText?: never });

export function Icon({
  icon: Glyph,
  size = "medium",
  tone = "current",
  className,
  containerClassName,
  ...rest
}: IconProps) {
  const labelled = "assistiveText" in rest && rest.assistiveText !== undefined;

  return (
    <span className={cx("slds-icon_container", TONE_CLASS[tone], containerClassName)}>
      <Glyph
        className={cx("slds-icon", SIZE_CLASS[size], className)}
        size={SIZE_GLYPH[size]}
        aria-hidden="true"
        focusable="false"
      />
      {labelled ? <span className="slds-assistive-text">{rest.assistiveText}</span> : null}
    </span>
  );
}
