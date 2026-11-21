import { intro } from "@/data/angeronia";

/** Who you are hiring. Stub: the heading only. Phase B (B2) builds it. */
export function Intro() {
  return (
    <section aria-labelledby="intro-heading" className="frame section">
      <h2 id="intro-heading">{intro.heading}</h2>
    </section>
  );
}
