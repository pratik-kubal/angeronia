"use client";

import * as React from "react";
import styles from "./site-header.module.css";

/**
 * The `<header>` element, and the one piece of state it has: whether the page
 * has scrolled (design.md §4.1). `overlay` starts transparent over the hero and
 * turns solid, with `data-stuck="true"`, once an 8px sentinel at the top of the
 * document leaves the screen. `solid` (the legal pages) is always stuck and
 * watches nothing.
 *
 * The sentinel is the header's previous sibling, not a child: the header is
 * `position: fixed` once scripts run, and a fixed sentinel would never scroll
 * out of view. Without scripts the state stays "false" and the header, being
 * `position: absolute`, scrolls away with the page.
 */
export function HeaderState({
  variant,
  className,
  children,
}: {
  variant: "overlay" | "solid";
  className?: string;
  children: React.ReactNode;
}) {
  const sentinel = React.useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = React.useState(variant === "solid");

  React.useEffect(() => {
    if (variant === "solid") {
      setStuck(true);
      return;
    }
    const el = sentinel.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setStuck(true);
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      const latest = entries[entries.length - 1];
      if (latest) setStuck(!latest.isIntersecting);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [variant]);

  return (
    <>
      {variant === "overlay" ? (
        <div ref={sentinel} className={styles.sentinel} aria-hidden="true" />
      ) : null}
      <header className={className} data-stuck={stuck ? "true" : "false"}>
        {children}
      </header>
    </>
  );
}
