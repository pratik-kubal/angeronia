import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BrandMark } from "./brand-mark";

const meta = {
  title: "Sections/BrandMark",
  component: BrandMark,
  parameters: {
    docs: {
      description: {
        component:
          "The mark is drawn in hooks, not hexes: the disc is " +
          "`accent-container-1` (Teal 60 in both schemes) and the cursor is its " +
          "paired `on-accent-1`, which is what keeps it legible at 4.99:1 " +
          "without the component knowing what colour either one is.\n\n" +
          "`scripts/build-logos.mjs` renders the same geometry for the " +
          "OG/social rasters, and `scripts/retint-favicon.mjs` maps the faceted " +
          "favicon onto the same teal ramp.",
      },
    },
  },
} satisfies Meta<typeof BrandMark>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const MarkOnly: Story = { args: { showWord: false, size: 48 } };

export const WithoutSubline: Story = { args: { showSub: false } };

export const Sizes: Story = {
  render: () => (
    <div className="slds-grid slds-grid_vertical">
      {[20, 28, 40, 64].map((size) => (
        <div key={size} className="slds-col slds-m-bottom_medium">
          <BrandMark size={size} showSub={false} />
        </div>
      ))}
    </div>
  ),
};

export const Dark: Story = { globals: { colorScheme: "dark" } };
