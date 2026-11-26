import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { services } from "@/data/angeronia";
import { Services } from "./services";

const meta = {
  title: "Sections/Services",
  component: Services,
  parameters: {
    band: false,
    docs: {
      description: {
        component:
          "Four kinds of work as a stepped ledger on the spine: each name crosses, hangs from or is " +
          "pushed past the axis, then its pair (your need, the studio's build) and its four parts as a " +
          "real list.",
      },
    },
  },
} satisfies Meta<typeof Services>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole("heading", { level: 3 })).toHaveLength(services.areas.length);
    const lists = canvas.getAllByRole("list", { name: services.partsLabel });
    await expect(lists).toHaveLength(services.areas.length);
    for (const list of lists) await expect(within(list).getAllByRole("listitem")).toHaveLength(4);
  },
};

export const Phone: Story = {
  globals: { viewport: { value: "phone", isRotated: false } },
};
