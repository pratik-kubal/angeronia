"use client";

import { useEffect, useRef, useState } from "react";
import { product } from "@/data/angeronia";

// The Approach → Complexity → Code loop lights one node at a time — an ambient
// nod to Code Socratic's teaching loop. Paused while off-screen.
function useLoopCycle(length: number, sectionRef: React.RefObject<HTMLElement | null>) {
  const [lit, setLit] = useState(0);
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    if (typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    let timer: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      if (timer) return;
      timer = setInterval(() => setLit((v) => (v + 1) % length), 1100);
    };
    const stop = () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };
    const io = new IntersectionObserver(
      (entries) => (entries[0].isIntersecting ? start() : stop()),
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => {
      stop();
      io.disconnect();
    };
  }, [length, sectionRef]);
  return lit;
}

export function ProductSpotlight() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const lit = useLoopCycle(product.loop.length, sectionRef);

  return (
    <section
      ref={sectionRef}
      id="work"
      data-screen-label="Code Socratic"
      className="ang-product"
    >
      <div className="ang-product-inner" data-reveal>
        <div className="ang-product-grid">
          <div className="ang-product-copy">
            <p className="ang-product-kicker">
              {product.kicker} · {product.label}
            </p>
            <p className="ang-product-name">
              Code<span className="dot">.</span>Socratic
            </p>
            <h2 className="ang-product-head">{product.headline}</h2>

            <div className="ang-loop" aria-label="The teaching loop">
              {product.loop.map((node, i) => (
                <span key={node} style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                  {i > 0 ? <span className="ang-loop-arrow">→</span> : null}
                  <span className="ang-loop-node" data-lit={lit === i ? "true" : "false"}>
                    {node}
                  </span>
                </span>
              ))}
            </div>

            <p className="ang-product-body">{product.body}</p>
            <ul>
              {product.points.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
            <div className="ang-tags">
              {product.tags.map((t) => (
                <span className="ang-tag" key={t}>
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className="ang-product-side">
            <p className="ang-product-note">{product.note}</p>
            <div style={{ marginTop: 22 }}>
              <a
                href={product.cta.href}
                className="ang-btn ang-btn-fill"
                target="_blank"
                rel="noopener noreferrer"
              >
                {product.cta.label}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
