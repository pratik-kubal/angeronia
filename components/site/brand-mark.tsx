import styles from "./brand-mark.module.css";

/**
 * The Angeronia Labs mark: a disc with the studio's cursor, gold on warm black
 * (design.md §5.3). Decorative: it always sits beside the name, which says it.
 */
export function BrandMark({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
    >
      <circle className={styles.disc} cx="17.5" cy="16" r="12.5" />
      {/* Cursor arrow, up-left, seated on the disc. */}
      <path
        className={styles.cursor}
        d="M11.2 7.6 L23.4 14.1 L16.9 15.4 L20.2 22.1 L17.1 23.5 L13.8 16.8 L9.4 21.2 Z"
      />
    </svg>
  );
}
