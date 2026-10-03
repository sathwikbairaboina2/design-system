import type { Meta, StoryObj } from '@storybook/react-vite';
import { Card } from '@sathwik/ui';

const meta = { title: 'Components/Card', component: Card } satisfies Meta<typeof Card>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { children: 'A card groups related content.' } };
export const WithTitle: Story = { args: { title: 'Team plan', children: 'Up to 10 seats, billed monthly.' } };
