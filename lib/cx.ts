/**
 * Join class names, dropping anything falsy.
 *
 * `clsx` and nothing more. CSS Module class names are unique per module, so
 * there is nothing to merge.
 */
export { default as cx } from "clsx";
export type { ClassValue } from "clsx";
