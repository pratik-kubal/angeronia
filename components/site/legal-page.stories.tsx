import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { privacyPolicy } from "@/data/angeronia";
import { LegalPage } from "./legal-page";

const meta = {
  title: "Sections/LegalPage",
  component: LegalPage,
  parameters: {
    layout: "fullscreen",
    viewport: {
      options: {
        phone: { name: "Phone", styles: { width: "390px", height: "844px" } },
      },
    },
  },
  args: { document: privacyPolicy },
} satisfies Meta<typeof LegalPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** The reading column spans all twelve columns on a phone. */
export const Phone: Story = {
  globals: { viewport: { value: "phone", isRotated: false } },
};
