import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '@sathwik/ui';

const meta = { title: 'Components/Button', component: Button, args: { children: 'Save changes' } } satisfies Meta<typeof Button>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = { args: { variant: 'primary' } };
export const Secondary: Story = { args: { variant: 'secondary' } };
export const Ghost: Story = { args: { variant: 'ghost' } };
export const Danger: Story = { args: { variant: 'danger', children: 'Delete' } };
export const Small: Story = { args: { size: 'sm' } };
export const Loading: Story = { args: { loading: true } };
export const Disabled: Story = { args: { disabled: true } };
