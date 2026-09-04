import { footer } from "@/data/angeronia";
import { BrandMark } from "./brand-mark";

const isExternal = (href: string) => /^https?:|^mailto:/.test(href);

export function SiteFooter() {
  return (
    <footer className="ang-footer ang-bleed">
      <div className="ang-footer-inner">
        <div className="ang-foot-row">
          <div className="ang-foot-brand">
            <a href="#top" style={{ textDecoration: "none" }}>
              <BrandMark size={30} showWord showSub={false} wordSize="1.05rem" />
            </a>
            <p className="ang-foot-tagline">{footer.tagline}</p>
          </div>

          <div className="ang-foot-cols">
            {footer.columns.map((col) => (
              <nav key={col.title} aria-label={col.title} className="ang-foot-col">
                <p>{col.title}</p>
                {col.links.map((l) => (
                  <a
                    key={l.href + l.label}
                    className="ang-mlink"
                    href={l.href}
                    target={isExternal(l.href) ? "_blank" : undefined}
                    rel={isExternal(l.href) ? "noopener noreferrer" : undefined}
                  >
                    {l.label}
                  </a>
                ))}
              </nav>
            ))}
          </div>
        </div>

        <div className="ang-copyright">
          <span>{footer.copyrightLeft}</span>
          <span>{footer.copyrightRight}</span>
        </div>
      </div>
    </footer>
  );
}
