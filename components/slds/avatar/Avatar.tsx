import { cx, type ClassValue } from "@/lib/slds/cx";

/**
 * The SLDS 2 Avatar blueprint.
 *
 * Either an image or initials — never both, and never neither, so the type is
 * a union rather than two optional props. An avatar always stands for a person
 * or an entity, so `alt` (image) or `label` (initials) is required: it is the
 * only place that identity is announced.
 */

export type AvatarSize = "x-small" | "small" | "medium" | "large";

const SIZE_CLASS: Record<AvatarSize, string | null> = {
  "x-small": "slds-avatar_x-small",
  small: "slds-avatar_small",
  medium: null,
  large: "slds-avatar_large",
};

interface AvatarBase {
  size?: AvatarSize;
  /** Round rather than rounded-rectangle. Use for people. */
  circle?: boolean;
  className?: ClassValue;
}

export type AvatarProps =
  | (AvatarBase & { src: string; alt: string; initials?: never; label?: never })
  | (AvatarBase & { initials: string; label: string; src?: never; alt?: never });

export function Avatar({ size = "medium", circle, className, ...rest }: AvatarProps) {
  const classes = cx("slds-avatar", SIZE_CLASS[size], circle && "slds-avatar_circle", className);

  if ("src" in rest && rest.src !== undefined) {
    return (
      <span className={classes}>
        {/* eslint-disable-next-line @next/next/no-img-element -- avatars are
            fixed-size, already-optimised brand assets; next/image adds a
            wrapper that fights `slds-avatar`'s own sizing. */}
        <img src={rest.src} alt={rest.alt} />
      </span>
    );
  }

  return (
    <span className={classes}>
      <abbr className="slds-avatar__initials" title={rest.label}>
        {rest.initials}
      </abbr>
    </span>
  );
}
