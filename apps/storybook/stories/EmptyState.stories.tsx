import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, EmptyState } from '@sathwik/ui';

const meta = {
  title: 'Components/EmptyState',
  component: EmptyState,
  args: { title: 'No invoices yet', description: 'Invoices appear here after your first billing cycle.' },
} satisfies Meta<typeof EmptyState>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithAction: Story = { args: { action: <Button>Create invoice</Button> } };
