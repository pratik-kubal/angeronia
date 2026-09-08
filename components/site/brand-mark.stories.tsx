import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BrandMark } from "./brand-mark";

const meta = {
  title: "Sections/BrandMark",
  component: BrandMark,
  parameters: {
    docs: {
      description: {
        component:
          "The mark is drawn in tokens, not hexes: the disc is " +
          "`$background-brand` (Teal 60 in both themes) and the cursor is its " +
          "paired `$text-on-color`, which is what keeps it legible at 4.99:1 " +
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
    <div className="site-cards">
      {[20, 28, 40, 64].map((size) => (
        <BrandMark key={size} size={size} showSub={false} />
      ))}
    </div>
  ),
};

export const Dark: Story = { globals: { colorScheme: "dark" } };
