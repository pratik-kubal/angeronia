import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Board } from "./Swatch";
import { token } from "./tokens";

const SPACING = [
  "01",
  "02",
  "03",
  "04",
  "05",
  "06",
  "07",
  "08",
  "09",
  "10",
  "11",
  "12",
  "13",
];
const SITE_VALUES = [
  { name: "--site-measure", use: "The prose measure — a paragraph's maximum line." },
  { name: "--site-measure-heading", use: "The heading measure, so a display line breaks well." },
  { name: "--site-measure-quote", use: "The low-bono quote, one step narrower than a heading." },
  { name: "--site-border-width", use: "Carbon draws its own borders at this width." },
  { name: "--site-border-width-strong", use: "An interactive or accent edge." },
  { name: "--site-figure-min", use: "The hero Möbius, at its smallest." },
  { name: "--site-figure-max", use: "The hero Möbius, at its largest." },
  { name: "--site-pane-max", use: "How tall a pane in the session replica scrolls within." },
  { name: "--site-container-max", use: "The page's own width cap, shorter than Carbon's 99rem." },
];

/**
 * Spacing, shape and motion — the non-colour half of the visual language, on
 * one board because the rule that governs them is the same: reference the
 * token, never the number.
 */
function ShapeBoard() {
  return (
    <div>
      <Board title="Spacing — Carbon's scale, for margin, padding and gap">
        <div className="sb-scroll">
          <table className="sb-table">
            <thead>
              <tr>
                <th scope="col">Token</th>
                <th scope="col">Value</th>
                <th scope="col">Width</th>
              </tr>
            </thead>
            <tbody>
              {SPACING.map((step) => (
                <tr key={step}>
                  <td>
                    <code className="sb-mono">spacing-{step}</code>
                  </td>
                  <td>{token(`--cds-spacing-${step}`)}</td>
                  <td>
                    <span
                      className="sb-box"
                      style={{ display: "block", width: `var(--cds-spacing-${step})` }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="sb-note site-measure">
          Section rhythm uses the <code className="sb-mono">$layout-*</code> scale on top of these.
          Both are Sass-side in Carbon; the custom properties above exist because Carbon emits them
          for consumption from plain CSS.
        </p>
      </Board>

      <Board title="Shape — square, on purpose">
        <div className="sb-grid">
          <div className="sb-tile">
            <code className="sb-mono">A card</code>
            <p className="sb-quiet site-body_small">1px border, no radius, no shadow.</p>
          </div>
        </div>
        <p className="sb-note site-measure">
          Carbon is square and has no elevation scale in v11. The site takes both as they come
          (ADR-015): buttons are rectangles, a card&rsquo;s edge is a border rather than a shadow,
          and nothing on the page carries a radius. The SLDS build&rsquo;s pill buttons,{" "}
          <code className="sb-mono">border-4</code> cards and single shadow level are gone with it.
        </p>
      </Board>

      <Board title="Site values — what Carbon has no token for">
        <div className="sb-scroll">
          <table className="sb-table">
            <thead>
              <tr>
                <th scope="col">Custom property</th>
                <th scope="col">Value</th>
                <th scope="col">What it is</th>
              </tr>
            </thead>
            <tbody>
              {SITE_VALUES.map(({ name, use }) => (
                <tr key={name}>
                  <td>
                    <code className="sb-mono">{name}</code>
                  </td>
                  <td>{token(name) || "—"}</td>
                  <td className="sb-quiet">{use}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="sb-note site-measure">
          Declared once at the top of <code className="sb-mono">styles/_site.scss</code>, so no rule
          in that file carries a bare number.
        </p>
      </Board>

      <Board title="Motion — Carbon durations only, nothing scroll-linked">
        <p className="site-measure">
          The site uses only the transitions Carbon&rsquo;s own components define — a button&rsquo;s
          hover, a link&rsquo;s colour change, the focus ring. No scroll-linked animation and no
          autoplay, with one waiver: the hero Möbius turns on its own (ADR-013), stops off screen,
          draws a single static frame under <code className="sb-mono">prefers-reduced-motion</code>,
          and is not rendered at all below <code className="sb-mono">md</code>.
        </p>
      </Board>
    </div>
  );
}

const meta = {
  title: "Foundations/Spacing, Shape & Motion",
  component: ShapeBoard,
} satisfies Meta<typeof ShapeBoard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Light: Story = {};
export const Dark: Story = { globals: { colorScheme: "dark" } };
