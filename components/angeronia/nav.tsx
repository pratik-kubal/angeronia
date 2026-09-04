import { ThemeToggle } from "./theme-toggle";
import { BrandMark } from "./brand-mark";
import { hero } from "@/data/angeronia";

export function Nav() {
  return (
    <nav className="ang-nav">
      <a href="#top" className="ang-brand" style={{ textDecoration: "none" }}>
        <BrandMark size={28} showWord showSub wordSize="1rem" />
      </a>
      <div className="ang-nav-right">
        <ThemeToggle />
        <a href={hero.ctaPrimary.href} className="ang-btn ang-btn-outline">
          Start a project
        </a>
      </div>
    </nav>
  );
}
