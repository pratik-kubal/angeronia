import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { Band } from "./band";
import { Statement } from "./statement";
import frames from "@/stories/frames.module.css";

const meta = {
  title: "Components/Band",
  component: Band,
  parameters: {
    // A band brings its own ground.
    band: false,
    docs: {
      description: {
        component:
          "A full-width band of the page and the spine through it. It sets `data-band` (the colour " +
          "roles, and the scope of the focus ring and selection) and carries the line: a `::before` at " +
          "the axis without script, and an empty track that `Spine` fills with the line's pieces. A " +
          "section passes its own padding as a `className`.",
      },
    },
  },
  args: { as: "section", band: "paper", className: frames.padded, children: null },
} satisfies Meta<typeof Band>;

export default meta;
type Story = StoryObj<typeof meta>;

const lines = [{ hang: "One engineer," }, { cross: ["screen", "to server"] }] as const;

export const Paper: Story = {
  args: {
    "aria-label": "A paper band",
    children: <Statement as="p" size="display" lines={lines} motion="still" />,
  },
  play: async ({ canvasElement }) => {
    const band = canvasElement.querySelector<HTMLElement>("[data-band]");
    await expect(band).toHaveAttribute("data-band", "paper");
    await expect(band).toHaveAttribute("data-spined");
    // Without script the line is the band's ::before, at the axis.
    const line = getComputedStyle(band!, "::before");
    await expect(line.width).toBe("2px");
    await expect(band!.querySelector("[data-spine-track]")).toHaveAttribute("aria-hidden", "true");
  },
};

export const Dark: Story = {
  args: {
    band: "dark",
    "aria-label": "The charcoal band",
    children: <Statement as="p" size="display" lines={lines} motion="still" />,
  },
};
