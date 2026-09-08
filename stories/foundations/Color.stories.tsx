import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Board, Pairing, Swatch } from "./Swatch";

/**
 * Colour by role: which token to reach for, and what it is paired with.
 *
 * Nothing here is a palette to pick from — the roles are the API. Reaching for
 * a hex, or for a support colour to mean something other than status, is what
 * design rule 4 forbids.
 */
function ColorBoard() {
  return (
    <div>
      <Board title="Grounds and their ink">
        <div className="sb-grid">
          {["background", "layer-01", "layer-02"].map((s) => (
            <Pairing key={s} on="--cds-text-primary" container={`--cds-${s}`} />
          ))}
        </div>
        <p className="sb-note site-measure">
          Carbon&rsquo;s layer model steps <em>up</em> from the page ground: the page is{" "}
          <code className="sb-mono">background</code>, a shaded band is{" "}
          <code className="sb-mono">layer-01</code>, and a card on that band is{" "}
          <code className="sb-mono">layer-02</code>. A <code className="sb-mono">&lt;Layer&gt;</code>{" "}
          does the stepping, so a card never has to know which band it is on.
        </p>
      </Board>

      <Board title="Text and border">
        <div className="sb-grid">
          {[
            "text-primary",
            "text-secondary",
            "text-on-color",
            "border-subtle-01",
            "border-subtle-02",
            "border-strong-01",
          ].map((name) => (
            <Swatch key={name} name={`--cds-${name}`} />
          ))}
        </div>
      </Board>

      <Board title="Brand — the teal, reachable only through these">
        <div className="sb-grid">
          {[
            "link-primary",
            "link-primary-hover",
            "link-secondary",
            "background-brand",
            "button-primary",
            "border-interactive",
            "icon-interactive",
            "focus",
          ].map((name) => (
            <Swatch key={name} name={`--cds-${name}`} />
          ))}
        </div>
        <p className="sb-note site-measure">
          These are the tokens <code className="sb-mono">styles/_themes.scss</code> reassigns from
          Carbon&rsquo;s Blue 60 family to Teal. Everything else on this page is Carbon&rsquo;s stock
          value.
        </p>
      </Board>

      <Board title="Support — for status only">
        <div className="sb-grid">
          {["support-error", "support-success", "support-warning", "support-info"].map((name) => (
            <Pairing key={name} on={`--cds-${name}`} container="--cds-background" min={3} />
          ))}
        </div>
        <p className="sb-note site-measure">
          Untouched by the brand override, and deliberately so: teal sits close to Carbon&rsquo;s
          green on the wheel, and a brand colour that can be mistaken for &ldquo;success&rdquo; is a
          colour-only meaning waiting to happen (design rule 4).
        </p>
      </Board>
    </div>
  );
}

const meta = {
  title: "Foundations/Color",
  component: ColorBoard,
} satisfies Meta<typeof ColorBoard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Light: Story = {};
export const Dark: Story = { globals: { colorScheme: "dark" } };
