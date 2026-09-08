import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LegalPage } from "./legal-page";
import { privacyPolicy, termsOfService } from "@/data/angeronia";

const meta = {
  title: "Pages/Legal",
  component: LegalPage,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Both legal documents render through one component, so the privacy " +
          "policy and the terms cannot drift apart in layout or in type — the " +
          "difference between them is entirely data.\n\n" +
          "These are the only pages on the site read as continuous prose, so " +
          "the body is held to a 60ch measure rather than the page width. The " +
          "updated date is a `<time>` with a machine-readable " +
          "`dateTime`: a legal document's date is its notice, so it should be " +
          "as legible to a crawler or a reader-mode as it is on the page.",
      },
    },
  },
} satisfies Meta<typeof LegalPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Privacy: Story = { args: { document: privacyPolicy } };

export const Terms: Story = { args: { document: termsOfService } };

export const PrivacyDark: Story = {
  args: { document: privacyPolicy },
  globals: { colorScheme: "dark" },
};
