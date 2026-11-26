import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { belief, statementText } from "@/data/angeronia";
import { Belief } from "./belief";

const meta = {
  title: "Sections/Belief",
  component: Belief,
  parameters: {
    band: false,
    docs: {
      description: {
        component:
          "The belief on the page's one charcoal band. Shown here in its finished composition, closed: " +
          "the held scene (desktop, with script and motion) opens it to the margins and closes it over " +
          "0.8 of a screen of scroll.",
      },
    },
  },
} satisfies Meta<typeof Belief>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const band = canvasElement.querySelector("[data-band]");
    await expect(band).toHaveAttribute("data-band", "dark");
    await expect(band).toHaveAttribute("data-scene", "seam");
    await expect(band).not.toHaveAttribute("data-live");
    await expect(within(canvasElement).getByRole("heading", { level: 2 })).toHaveTextContent(statementText(belief.lines));
    // Every piece the scene moves is marked for it.
    await expect(canvasElement.querySelectorAll('[data-seam="l"]')).toHaveLength(2);
    await expect(canvasElement.querySelectorAll('[data-seam="r"]')).toHaveLength(3);
  },
};

export const Phone: Story = {
  globals: { viewport: { value: "phone", isRotated: false } },
};
