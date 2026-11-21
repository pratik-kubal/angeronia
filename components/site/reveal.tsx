"use client";

import * as React from "react";

declare global {
  interface Window {
    __angReady?: boolean;
  }
}

type RevealProps<T extends keyof React.JSX.IntrinsicElements> = {
  as?: T;
  children: React.ReactNode;
} & Omit<React.JSX.IntrinsicElements[T], "children" | "ref">;

/**
 * Marks a block so its `data-reveal` children arrive once when it enters view
 * (styles/motion.css). It only sets an attribute: with scripts off, or reduced
 * motion on, the children are simply there.
 */
export function Reveal<T extends keyof React.JSX.IntrinsicElements = "div">({
  as,
  children,
  ...rest
}: RevealProps<T>) {
  const Tag = (as ?? "div") as React.ElementType;
  const ref = React.useRef<HTMLElement>(null);
  const [seen, setSeen] = React.useState(false);

  React.useEffect(() => {
    window.__angReady = true;
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setSeen(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setSeen(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0 }, // ADR-030: tall sections on a phone
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag ref={ref} data-reveal-root="" data-in={seen ? "true" : undefined} {...rest}>
      {children}
    </Tag>
  );
}
