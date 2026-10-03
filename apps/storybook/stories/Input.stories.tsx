import type { Meta, StoryObj } from '@storybook/react-vite';
import { Input } from '@sathwik/ui';

const meta = { title: 'Components/Input', component: Input, args: { label: 'Email' } } satisfies Meta<typeof Input>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithHint: Story = { args: { hint: 'We only use it for receipts.' } };
export const WithError: Story = { args: { error: 'Enter a valid email address.', defaultValue: 'not-an-email' } };
export const Disabled: Story = { args: { disabled: true, defaultValue: 'locked@example.com' } };
