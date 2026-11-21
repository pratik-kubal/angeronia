import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LegalPage } from "@/components/site/legal-page";
import { privacyPolicy, termsOfService } from "@/data/angeronia";

/** The two legal pages, as `app/privacy` and `app/terms` render them. */
const meta = {
  title: "Pages/Legal",
  component: LegalPage,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof LegalPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Privacy: Story = { args: { document: privacyPolicy } };

export const Terms: Story = { args: { document: termsOfService } };
