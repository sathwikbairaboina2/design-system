import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, Dialog } from '@sathwik/ui';

const meta = {
  title: 'Components/Dialog',
  component: Dialog,
  args: {
    trigger: <Button>Pay now</Button>,
    title: 'Confirm payment',
    description: 'Your card will be charged once.',
    children: <Button variant="danger">Confirm</Button>,
  },
} satisfies Meta<typeof Dialog>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Closed: Story = {};
export const Open: Story = { args: { defaultOpen: true } };
