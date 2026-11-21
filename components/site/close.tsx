import { close } from "@/data/angeronia";

/** The closing ask and the footer. Stub: the heading only, when full. Phase B (B6) builds it. */
export function Close({ variant = "full" }: { variant?: "full" | "compact" }) {
  return (
    <footer id="contact" className="frame section">
      {variant === "full" ? <h2>{close.heading.join(" ")}</h2> : null}
    </footer>
  );
}
