import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { proof, proofPanels } from "@/data/angeronia";
import { Proof } from "./proof";

const meta = {
  title: "Sections/Proof",
  component: Proof,
  parameters: {
    layout: "fullscreen",
    viewport: {
      options: {
        phone: { name: "Phone", styles: { width: "390px", height: "844px" }, type: "mobile" },
      },
    },
  },
} satisfies Meta<typeof Proof>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The panel a caption belongs to. Captions are found by text, so a hidden panel is found too. */
const panelOf = (canvasElement: HTMLElement, caption: string) => {
  const figure = within(canvasElement).getByText(caption).closest("figure");
  if (!figure) throw new Error(`No panel captioned "${caption}"`);
  return figure;
};

/**
 * The exhibit at a desktop width (1280px): the first claim is chosen and its
 * panel shows; choosing the second claim swaps the panel.
 */
export const Default: Story = {
  globals: { viewport: { value: "desktop", isRotated: false } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const talk = panelOf(canvasElement, proofPanels.talk.caption);
    const run = panelOf(canvasElement, proofPanels.run.caption);

    await expect(talk).toBeVisible();
    await expect(run).not.toBeVisible();

    await userEvent.click(canvas.getByText(proof.claims[1].built));

    await expect(canvas.getByRole("radio", { name: proof.claims[1].built })).toBeChecked();
    await expect(run).toBeVisible();
    await expect(talk).not.toBeVisible();
  },
};

/** Every asset given a link, to prove the list's layout. Today every link is null. */
export const WithAssets: Story = {
  args: {
    assets: proof.assets.map((asset, index) => ({
      label: asset.label,
      href: `https://example.com/asset-${index + 1}`,
    })),
  },
};

/** Below 1000px there is nothing to choose: every panel sits under its claim. */
export const Phone: Story = {
  globals: { viewport: { value: "phone", isRotated: false } },
};
