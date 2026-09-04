/**
 * Join class names, dropping anything falsy.
 *
 * Replaces the old `cn()` helper, which existed only to run `tailwind-merge`.
 * SLDS class names do not collide the way utility classes do, so there is
 * nothing left to merge — this is `clsx` and nothing more.
 */
export { default as cx } from "clsx";
export type { ClassValue } from "clsx";
