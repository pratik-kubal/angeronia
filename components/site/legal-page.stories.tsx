import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { privacyPolicy } from "@/data/angeronia";
import { LegalPage } from "./legal-page";

const meta = {
  title: "Sections/LegalPage",
  component: LegalPage,
  parameters: { layout: "fullscreen" },
  args: { document: privacyPolicy },
} satisfies Meta<typeof LegalPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
