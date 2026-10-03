import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tabs } from '@sathwik/ui';

const items = [
  { value: 'invoices', label: 'Invoices', content: <p>Four invoices this quarter.</p> },
  { value: 'methods', label: 'Payment methods', content: <p>Visa ending 4242.</p> },
  { value: 'history', label: 'History', content: <p>No changes yet.</p> },
];

const meta = {
  title: 'Components/Tabs',
  component: Tabs,
  args: { items, 'aria-label': 'Billing sections' },
} satisfies Meta<typeof Tabs>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const SecondSelected: Story = { args: { defaultValue: 'methods' } };
