import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Sun, Moon, Laptop } from "@carbon/icons-react";
import { ButtonGroup } from "./ButtonGroup";
import { Button } from "@/components/slds/button";
import { ButtonIcon } from "@/components/slds/button-icon";

const meta = {
  title: "Components/ButtonGroup",
  component: ButtonGroup,
  parameters: {
    docs: {
      description: {
        component:
          "Related controls that read as one unit. `label` is required because " +
          "a visually obvious grouping is invisible to a screen reader without " +
          "a name on the `role=\"group\"`.",
      },
    },
  },
  args: { label: "Colour scheme" },
} satisfies Meta<typeof ButtonGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <>
        <ButtonIcon icon={Sun} assistiveText="Light" variant="border-filled" size="small" pressed />
        <ButtonIcon icon={Moon} assistiveText="Dark" variant="border-filled" size="small" pressed={false} />
        <ButtonIcon icon={Laptop} assistiveText="Match system" variant="border-filled" size="small" pressed={false} />
      </>
    ),
  },
};

export const TextButtons: Story = {
  args: {
    label: "Record actions",
    children: (
      <>
        <Button>Edit</Button>
        <Button>Share</Button>
        <Button>Archive</Button>
      </>
    ),
  },
};

export const Dark: Story = {
  ...Default,
  globals: { colorScheme: "dark" },
};
