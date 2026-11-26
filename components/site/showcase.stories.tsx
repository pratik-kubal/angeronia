import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { showcase } from "@/data/angeronia";
import { Showcase } from "./showcase";

const meta = {
  title: "Sections/Showcase",
  component: Showcase,
  parameters: {
    band: false,
    docs: {
      description: {
        component:
          "Code.Socratic, built alone: the statement, what the product is, the replica of a real " +
          "session across the spine at full width, and the product layer by layer. No test figures " +
          "outside the replica (the owner's ruling); its Results tab keeps them, as the product does.",
      },
    },
  },
} satisfies Meta<typeof Showcase>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Text outside the replica's `data-ui` fragments. */
function pageText(root: HTMLElement) {
  const copy = root.cloneNode(true) as HTMLElement;
  for (const ui of copy.querySelectorAll("[data-ui]")) ui.remove();
  return copy.textContent ?? "";
}

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // The replica is a figure, captioned by what it is.
    const figure = canvasElement.querySelector("figure");
    await expect(figure?.querySelector("[data-ui]")).not.toBeNull();
    await expect(figure?.querySelector("figcaption")).toHaveTextContent(showcase.caption);
    await expect(canvas.getAllByRole("heading", { level: 3 })).toHaveLength(showcase.layers.length);
    const link = canvas.getByRole("link", { name: new RegExp(showcase.cta.label) });
    await expect(link).toHaveAttribute("href", "https://www.code-socratic.com");
    // The owner's ruling: no sample-test or hidden-test figures on the page.
    const text = pageText(canvasElement);
    await expect(text).not.toMatch(/2\s*\/\s*2|7\s*\/\s*7|84\s*ms|sample tests|hidden tests pass/i);
  },
};

export const Phone: Story = {
  globals: { viewport: { value: "phone", isRotated: false } },
};
