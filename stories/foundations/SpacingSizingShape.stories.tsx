import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Board } from "./Swatch";
import { hook } from "./tokens";

const SPACING = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
const RADIUS = ["border-1", "border-2", "border-3", "border-4", "border-pill"];
const SHADOW = ["1", "2", "3", "4"];
const DURATION = ["immediately", "quickly", "promptly", "slowly", "paused"];

/**
 * Spacing, sizing, shape and motion — the non-colour half of the visual
 * language, on one board because the rules that govern them are the same:
 * reference the hook, never the number.
 */
function ShapeBoard() {
  return (
    <div>
      <Board title="Spacing — a 4-pt scale, for margin, padding and gap">
        <div className="sb-scroll">
          <table className="sb-table">
            <thead>
              <tr>
                <th scope="col">Hook</th>
                <th scope="col">Value</th>
                <th scope="col">Width</th>
              </tr>
            </thead>
            <tbody>
              {SPACING.map((step) => (
                <tr key={step}>
                  <td>
                    <code className="slds-text-font_monospace">spacing-{step}</code>
                  </td>
                  <td>{hook(`--slds-g-spacing-${step}`)}</td>
                  <td>
                    <span
                      className="sb-box"
                      style={{ display: "block", width: `var(--slds-g-spacing-${step})` }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="slds-m-top_medium site-measure">
          Sizing hooks — <code className="slds-text-font_monospace">--slds-g-sizing-*</code> — are a
          separate family, for width and height. Using a spacing hook for a
          width is the mistake this split exists to prevent.
        </p>
      </Board>

      <Board title="Radius — less is best; never mix sharp and rounded">
        <div className="sb-grid">
          {RADIUS.map((name) => (
            <div key={name} className="sb-tile" style={{ borderRadius: `var(--slds-g-radius-${name})` }}>
              <code className="slds-text-font_monospace">radius-{name}</code>
              <p className="slds-text-body_small slds-text-color_weak">
                {hook(`--slds-g-radius-${name}`)}
              </p>
            </div>
          ))}
        </div>
        <p className="slds-m-top_medium site-measure">
          On this site: buttons are pill, cards are{" "}
          <code className="slds-text-font_monospace">border-4</code>, inputs are{" "}
          <code className="slds-text-font_monospace">border-2</code>.
        </p>
      </Board>

      <Board title="Shadow — one level per element, never stacked">
        <div className="sb-grid">
          {SHADOW.map((step) => (
            <div key={step} className="sb-tile" style={{ boxShadow: `var(--slds-g-shadow-${step})` }}>
              <code className="slds-text-font_monospace">shadow-{step}</code>
              <p className="slds-text-body_small slds-text-color_weak">
                {["at rest", "default", "hover", "floating"][Number(step) - 1]}
              </p>
            </div>
          ))}
        </div>
      </Board>

      <Board title="Motion — SLDS durations only, nothing scroll-linked">
        <div className="sb-scroll">
          <table className="sb-table">
            <thead>
              <tr>
                <th scope="col">Hook</th>
                <th scope="col">Value</th>
              </tr>
            </thead>
            <tbody>
              {DURATION.map((name) => (
                <tr key={name}>
                  <td>
                    <code className="slds-text-font_monospace">duration-{name}</code>
                  </td>
                  <td>{hook(`--slds-g-duration-${name}`)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="slds-m-top_medium site-measure">
          The site uses only the transitions the theme already defines — the
          brand button&rsquo;s hover lift and the link colour change. No
          scroll-linked animation, no canvas, no autoplay.
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
