import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ProgressBar } from "./ProgressBar";
/*
 * A local fixture. This used to render the site's Proof section from
 * `data/angeronia.ts`; that section was removed, and a component story should
 * not have depended on page copy in the first place.
 */
const SAMPLE = [
  { label: "Coverage", percent: 70, valueText: "70% org-wide", note: "dependency-injection patterns, made default" },
  { label: "Latency budget", percent: 90, valueText: "90% used", note: "p95 against the 200ms target" },
  { label: "Pipeline", percent: 100, valueText: "100% green", note: "last 30 runs" },
];

const meta = {
  title: "Components/ProgressBar",
  component: ProgressBar,
  parameters: {
    docs: {
      description: {
        component:
          "A labelled bar, never a bare one: `label` and `valueText` are " +
          "required, so the figure is readable as text and not only as a " +
          "length. Colour and length alone would be a colour-only meaning.\n\n" +
          "The fill length is data rather than design, so it travels as the " +
          "`--site-progress-bar-value` custom property and the width lives in " +
          "`app/site.css` (DECISIONS.md ADR-005).",
      },
    },
  },
  args: { value: 90, label: "API latency", valueText: "90% faster" },
} satisfies Meta<typeof ProgressBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithNote: Story = {
  args: { note: "graph-DB → Aurora · ~100K req/day · zero downtime" },
};

export const Sizes: Story = {
  render: (args) => (
    <div className="slds-grid slds-grid_vertical slds-gutters_small">
      {(["x-small", "small", "medium", "large"] as const).map((size) => (
        <div key={size} className="slds-col slds-m-bottom_small">
          <ProgressBar {...args} size={size} label={`API latency (${size})`} />
        </div>
      ))}
    </div>
  ),
};

export const Bounds: Story = {
  render: (args) => (
    <div className="slds-grid slds-grid_vertical">
      {[0, 50, 100, 140].map((value) => (
        <div key={value} className="slds-col slds-m-bottom_small">
          <ProgressBar
            {...args}
            value={value}
            label={`value = ${value}`}
            valueText={`${Math.min(100, Math.max(0, value))}%`}
          />
        </div>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: { story: "Out-of-range input is clamped rather than allowed to overflow the track." },
    },
  },
};

export const Stacked: Story = {
  render: () => (
    <div className="slds-grid slds-grid_vertical">
      {SAMPLE.map((row) => (
        <div key={row.label} className="slds-col slds-m-bottom_medium">
          <ProgressBar
            value={row.percent}
            label={row.label}
            valueText={row.valueText}
            note={row.note}
          />
        </div>
      ))}
    </div>
  ),
};

export const Dark: Story = {
  ...Stacked,
  globals: { colorScheme: "dark" },
};
