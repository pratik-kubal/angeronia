import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Board, Pairing, Swatch } from "./Swatch";

/**
 * Colour by role: which hook to reach for, and what it is paired with.
 *
 * Nothing here is a palette to pick from — the roles are the API. Reaching for
 * a hex, or for a feedback colour to mean something other than feedback, is
 * what design rule 4 forbids.
 */
function ColorBoard() {
  return (
    <div>
      <Board title="Surfaces and their ink">
        <div className="sb-grid">
          {["surface-1", "surface-2", "surface-3"].map((s) => (
            <Pairing key={s} on="--slds-g-color-on-surface-3" container={`--slds-g-color-${s}`} />
          ))}
        </div>
      </Board>

      <Board title="Containers">
        <div className="sb-grid">
          {[
            "surface-container-1",
            "surface-container-2",
            "surface-container-3",
            "surface-inverse-1",
            "surface-inverse-2",
          ].map((name) => (
            <Swatch key={name} name={`--slds-g-color-${name}`} />
          ))}
        </div>
      </Board>

      <Board title="Accent — the brand, reachable only through these">
        <div className="sb-grid">
          {[
            "accent-1",
            "accent-2",
            "accent-3",
            "accent-container-1",
            "accent-container-2",
            "accent-container-3",
            "border-accent-1",
            "border-accent-2",
          ].map((name) => (
            <Swatch key={name} name={`--slds-g-color-${name}`} />
          ))}
        </div>
        <p className="slds-m-top_medium site-measure">
          Links are <code className="slds-text-font_monospace">accent-2</code>; their hover state is{" "}
          <code className="slds-text-font_monospace">accent-3</code>. Both come from the base
          stylesheet, so a link needs no styling of its own.
        </p>
      </Board>

      <Board title="Feedback — for feedback only">
        <div className="sb-grid">
          {["error", "warning", "success", "info"].map((family) => (
            <Pairing
              key={family}
              on={`--slds-g-color-on-${family}-1`}
              container={`--slds-g-color-${family}-container-1`}
            />
          ))}
        </div>
      </Board>

      <Board title="Text and border">
        <div className="sb-grid">
          {[
            "on-surface-1",
            "on-surface-2",
            "on-surface-3",
            "border-1",
            "border-2",
            "border-3",
          ].map((name) => (
            <Swatch key={name} name={`--slds-g-color-${name}`} />
          ))}
        </div>
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
