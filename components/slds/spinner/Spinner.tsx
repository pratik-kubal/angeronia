import { cx, type ClassValue } from "@/lib/slds/cx";

/**
 * The SLDS 2 Spinner blueprint — pure CSS, no image.
 *
 * That is not incidental: SLDS 1's spinner was a GIF from the Salesforce asset
 * set, which D10 puts out of scope. This one draws itself from two pseudo
 * elements, so nothing is loaded and nothing is licensed.
 *
 * `label` is required — "Loading" has to be announced, not implied by motion.
 */
export interface SpinnerProps {
  label: string;
  size?: "xx-small" | "x-small" | "small" | "medium" | "large";
  variant?: "default" | "brand" | "inverse";
  /** Lay the spinner over its container rather than in the flow. */
  inline?: boolean;
  className?: ClassValue;
}

export function Spinner({
  label,
  size = "medium",
  variant = "default",
  inline,
  className,
}: SpinnerProps) {
  const spinner = (
    <div
      role="status"
      className={cx(
        "slds-spinner",
        `slds-spinner_${size}`,
        variant !== "default" && `slds-spinner_${variant}`,
        inline && "slds-spinner_inline",
        className,
      )}
    >
      <span className="slds-assistive-text">{label}</span>
      <div className="slds-spinner__dot-a" />
      <div className="slds-spinner__dot-b" />
    </div>
  );

  return inline ? spinner : <div className="slds-spinner_container">{spinner}</div>;
}
