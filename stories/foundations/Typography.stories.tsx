import * as React from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Board } from "./Swatch";

/**
 * The type styles the site actually uses, out of Carbon's much larger set.
 *
 * Carbon ships type as Sass tokens rather than CSS custom properties or utility
 * classes, so a board cannot read a size back the way it reads a colour. Each
 * row therefore renders the `site-*` class that consumes the token and reports
 * its computed size — which is the value that ships, not a value copied from a
 * table.
 */
const STYLES = [
  {
    className: "site-heading_display",
    token: "fluid-heading-05",
    use: "The hero and legal-page h1. 32px at sm, 60px at max, Plex Light from md.",
  },
  {
    className: "site-heading_section",
    token: "fluid-heading-04",
    use: "Every section h2.",
  },
  {
    className: "site-product__headline",
    token: "fluid-heading-03",
    use: "The product headline and the legal-page h2.",
  },
  {
    className: "site-card__title",
    token: "heading-03",
    use: "A card's title.",
  },
  {
    className: "site-benefit__title",
    token: "heading-02",
    use: "A sub-head inside a card.",
  },
  {
    className: "",
    token: "body-02",
    use: "Body copy. The page root sets it once and everything inherits.",
  },
  {
    className: "site-body_small",
    token: "body-01",
    use: "Footnotes, the footer, a caption.",
  },
  {
    className: "site-kicker",
    token: "label-01",
    use: "The eyebrow above a section heading, uppercased.",
  },
];

/**
 * Reports whether the real IBM Plex faces are in use.
 *
 * A board that silently renders in the system fallback would show the wrong
 * metrics for every sample below it, so this is stated rather than assumed.
 */
function FontCheck() {
  const [state, setState] = React.useState<{ sans: boolean; mono: boolean } | null>(null);

  React.useEffect(() => {
    let alive = true;
    document.fonts.ready.then(() => {
      if (!alive) return;
      setState({
        sans: document.fonts.check('1em "IBM Plex Sans"'),
        mono: document.fonts.check('1em "IBM Plex Mono"'),
      });
    });
    return () => {
      alive = false;
    };
  }, []);

  if (!state) return <p className="site-body_small">Checking loaded faces…</p>;

  return (
    <p className="site-body_small">
      IBM Plex Sans: <strong>{state.sans ? "loaded" : "NOT loaded — showing the fallback"}</strong>
      {" · "}
      IBM Plex Mono: <strong>{state.mono ? "loaded" : "not requested by this page"}</strong>
    </p>
  );
}

/** One row: the sample, the Carbon token behind it, and its computed size. */
function StyleRow({
  className,
  token,
  use,
}: {
  className: string;
  token: string;
  use: string;
}) {
  const ref = React.useRef<HTMLParagraphElement>(null);
  const [size, setSize] = React.useState("");

  React.useEffect(() => {
    if (!ref.current) return;
    const style = getComputedStyle(ref.current);
    setSize(`${style.fontSize} / ${style.lineHeight}, weight ${style.fontWeight}`);
  }, []);

  return (
    <tr>
      <td>
        <code className="sb-mono">{token}</code>
      </td>
      <td>
        <p ref={ref} className={className}>
          Angeronia Labs
        </p>
      </td>
      <td className="sb-quiet">{size || "—"}</td>
      <td className="sb-quiet">{use}</td>
    </tr>
  );
}

function TypographyBoard() {
  return (
    <div>
      <Board title="Families">
        <FontCheck />
        <p className="sb-note site-measure">
          IBM Plex Sans (300/400/600/700) and IBM Plex Mono (400), self-hosted by{" "}
          <code className="sb-mono">next/font</code> in{" "}
          <code className="sb-mono">app/layout.tsx</code> and exposed as{" "}
          <code className="sb-mono">--font-plex-sans</code> /{" "}
          <code className="sb-mono">--font-plex-mono</code>. Those two variables are read once, by
          Carbon&rsquo;s <code className="sb-mono">$font-families</code> map in{" "}
          <code className="sb-mono">styles/_config.scss</code>. Nowhere else on the site names a
          font family (design rule 5).
        </p>
      </Board>

      <Board title="The scale in use">
        <div className="sb-scroll">
          <table className="sb-table">
            <thead>
              <tr>
                <th scope="col">Carbon token</th>
                <th scope="col">Sample</th>
                <th scope="col">Computed</th>
                <th scope="col">Where</th>
              </tr>
            </thead>
            <tbody>
              {STYLES.map((s) => (
                <StyleRow key={s.token} {...s} />
              ))}
            </tbody>
          </table>
        </div>
        <p className="sb-note site-measure">
          The <code className="sb-mono">fluid-*</code> styles step with the viewport, so a size here
          is the size at <em>this</em> canvas width. Resize the preview and the top three rows move.
        </p>
      </Board>

      <Board title="Measure">
        <p className="site-measure sb-note">
          Prose is held to <code className="sb-mono">--site-measure</code> (60ch) — this paragraph
          is at it. Carbon has no measure token, so the site declares one; a 1200px line is
          unreadable however good the type is.
        </p>
        <p className="site-measure_heading sb-note">
          Headings are held to <code className="sb-mono">--site-measure-heading</code> (25ch), so a
          display line breaks where it should rather than where its column happens to end.
        </p>
      </Board>
    </div>
  );
}

const meta = {
  title: "Foundations/Typography",
  component: TypographyBoard,
} satisfies Meta<typeof TypographyBoard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Light: Story = {};

export const Dark: Story = { globals: { colorScheme: "dark" } };
