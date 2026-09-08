/**
 * Join class names, dropping anything falsy.
 *
 * `clsx` and nothing more. Carbon's class names do not collide the way utility
 * classes do, so there is nothing to merge.
 */
export { default as cx } from "clsx";
export type { ClassValue } from "clsx";
