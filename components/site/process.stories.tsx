import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { projectProcess } from "@/data/angeronia";
import { Process } from "./process";

const meta = {
  title: "Sections/Process",
  component: Process,
  parameters: {
    band: false,
    docs: {
      description: {
        component:
          "How a project runs: four steps as an ordered list, each name centred on the spine, what you " +
          "do on your side and what the studio does on its own.",
      },
    },
  },
} satisfies Meta<typeof Process>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const steps = canvas.getAllByRole("heading", { level: 3 });
    await expect(steps.map((h) => h.textContent)).toEqual(projectProcess.steps.map((s) => s.name));
    await expect(canvasElement.querySelector("ol")).toBeInTheDocument();
  },
};

export const Phone: Story = {
  globals: { viewport: { value: "phone", isRotated: false } },
};
