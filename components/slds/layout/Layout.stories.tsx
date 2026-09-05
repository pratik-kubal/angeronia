import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Grid, Col, Box, Container } from "./Layout";

const meta = {
  title: "Components/Layout",
  component: Grid,
  parameters: {
    docs: {
      description: {
        component:
          "Thin wrappers over SLDS 2's grid, container and box utilities, so a " +
          "page reads as structure rather than as a class-name string. " +
          "Anything they cannot express is written as utility classes " +
          "directly — that is rung 3 of the selection ladder, not a failure of " +
          "rung 1.",
      },
    },
  },
  args: { children: null },
} satisfies Meta<typeof Grid>;

export default meta;
type Story = StoryObj<typeof meta>;

const Cell = ({ children }: { children: React.ReactNode }) => (
  <Box padding="x-small" theme="shade">
    {children}
  </Box>
);

export const Columns: Story = {
  render: () => (
    <Grid wrap gutters>
      {[6, 6, 4, 4, 4, 3, 3, 3, 3].map((size, i) => (
        <Col key={i} size={12} medium={size} className="slds-m-bottom_small">
          <Cell>{`medium=${size}`}</Cell>
        </Col>
      ))}
    </Grid>
  ),
};

export const Alignment: Story = {
  render: () => (
    <div className="slds-grid slds-grid_vertical">
      {(["center", "end", "space", "spread"] as const).map((align) => (
        <div key={align} className="slds-col slds-m-bottom_small">
          <p className="slds-text-body_small slds-text-color_weak">{align}</p>
          <Grid align={align} gutters="small">
            <Cell>one</Cell>
            <Cell>two</Cell>
          </Grid>
        </div>
      ))}
    </div>
  ),
};

export const Boxes: Story = {
  render: () => (
    <Grid wrap gutters="small">
      {(["default", "small", "x-small", "xx-small"] as const).map((padding) => (
        <Col key={padding} size={6} medium={3}>
          <Box padding={padding} theme="shade">
            {padding}
          </Box>
        </Col>
      ))}
    </Grid>
  ),
};

export const Containers: Story = {
  render: () => (
    <div className="slds-grid slds-grid_vertical">
      {(["small", "medium", "large", "x-large"] as const).map((size) => (
        <div key={size} className="slds-col slds-m-bottom_small">
          <Container size={size}>
            <Cell>{`slds-container_${size}`}</Cell>
          </Container>
        </div>
      ))}
    </div>
  ),
};

export const Dark: Story = {
  ...Columns,
  globals: { colorScheme: "dark" },
};
