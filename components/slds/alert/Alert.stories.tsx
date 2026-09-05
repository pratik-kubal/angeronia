import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Alert } from "./Alert";

const meta = {
  title: "Components/Alert",
  component: Alert,
  parameters: {
    docs: {
      description: {
        component:
          "An inline message about the region it sits in — as opposed to a " +
          "Toast, which is about the page. The icon and the word in front of " +
          "the message do the work colour cannot: a red bar is not a message.\n\n" +
          "`role=\"alert\"` is reserved for `error` and `warning`, because it " +
          "interrupts a screen reader mid-sentence and an informational note " +
          "does not deserve that.",
      },
    },
  },
  args: { children: "The pipeline was green on every deploy last quarter." },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Info: Story = {};

export const AllTones: Story = {
  render: (args) => (
    <div className="slds-grid slds-grid_vertical">
      {(["info", "success", "warning", "error"] as const).map((tone) => (
        <div key={tone} className="slds-col slds-m-bottom_small">
          <Alert {...args} tone={tone}>
            {`A ${tone} message, with the tone named in the text as well as the colour.`}
          </Alert>
        </div>
      ))}
    </div>
  ),
};

export const Dark: Story = { ...AllTones, globals: { colorScheme: "dark" } };
