import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge, Inline, Stack } from '@sathwik/ui';

const meta = { title: 'Components/Stack', component: Stack } satisfies Meta<typeof Stack>;
export default meta;
type Story = StoryObj<typeof meta>;

const items = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta', 'Iota', 'Kappa'];

export const Vertical: Story = {
  render: () => (
    <Stack gap={3}>
      {items.slice(0, 3).map((name) => (
        <Badge key={name}>{name}</Badge>
      ))}
    </Stack>
  ),
};

export const InlineWrap: Story = {
  render: () => (
    <Inline gap={2}>
      {items.map((name) => (
        <Badge key={name} tone="accent">
          {name}
        </Badge>
      ))}
    </Inline>
  ),
};
