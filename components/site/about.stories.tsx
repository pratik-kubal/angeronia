import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { about, statementText } from "@/data/angeronia";
import { About } from "./about";

const meta = {
  title: "Sections/About",
  component: About,
  parameters: {
    band: false,
    docs: {
      description: {
        component:
          "Who you'd work with: Pratik Kubal, named, and the background behind the studio; then the " +
          "page's belief as two crossing lines at heading size, a lead paragraph below 1100px.",
      },
    },
  },
} satisfies Meta<typeof About>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const statement = canvasElement.querySelector<HTMLElement>("p[data-statement]");
    // One sentence, read straight through, with its spaces.
    await expect(statement?.textContent).toBe(statementText(about.statement));
    await expect(within(canvasElement).getByRole("heading", { level: 2 })).toHaveTextContent(statementText(about.lines));
  },
};

export const Tablet: Story = {
  globals: { viewport: { value: "tablet", isRotated: false } },
};

export const Phone: Story = {
  globals: { viewport: { value: "phone", isRotated: false } },
};
