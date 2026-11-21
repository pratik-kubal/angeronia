import { hero } from "@/data/angeronia";

/** The first screen. Stub: the name only. Phase B (B1) builds it. */
export function Hero() {
  return (
    <section aria-labelledby="hero-name" className="frame section">
      <h1 id="hero-name">{hero.name}</h1>
    </section>
  );
}
