import { cx, type ClassValue } from "@/lib/cx";

/**
 * Initials or an image in a disc. Carbon has no avatar component in v11's
 * public surface, so this is a site component (plan §4.1).
 *
 * Either an image or initials — never both, and never neither, so the type is a
 * union rather than two optional props. An avatar always stands for a person or
 * an entity, so `alt` (image) or `label` (initials) is required: it is the only
 * place that identity is announced.
 */

export type AvatarSize = "medium" | "large";

const SIZE_CLASS: Record<AvatarSize, string | null> = {
  medium: null,
  large: "site-avatar_large",
};

interface AvatarBase {
  size?: AvatarSize;
  className?: ClassValue;
}

export type AvatarProps =
  | (AvatarBase & { src: string; alt: string; initials?: never; label?: never })
  | (AvatarBase & { initials: string; label: string; src?: never; alt?: never });

export function Avatar({ size = "medium", className, ...rest }: AvatarProps) {
  const classes = cx("site-avatar", SIZE_CLASS[size], className);

  if ("src" in rest && rest.src !== undefined) {
    return (
      <span className={classes}>
        {/* eslint-disable-next-line @next/next/no-img-element -- avatars are
            fixed-size, already-optimised brand assets; next/image adds a
            wrapper that fights the disc's own sizing. */}
        <img src={rest.src} alt={rest.alt} />
      </span>
    );
  }

  return (
    <span className={classes}>
      <abbr className="site-avatar__initials" title={rest.label}>
        {rest.initials}
      </abbr>
    </span>
  );
}
