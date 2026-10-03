import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge, Inline } from '@sathwik/ui';

const meta = { title: 'Components/Badge', component: Badge } satisfies Meta<typeof Badge>;
export default meta;
type Story = StoryObj<typeof meta>;

export const AllTones: Story = {
  render: () => (
    <Inline gap={2}>
      <Badge tone="neutral">Neutral</Badge>
      <Badge tone="accent">Accent</Badge>
      <Badge tone="danger">Danger</Badge>
      <Badge tone="success">Success</Badge>
    </Inline>
  ),
};
