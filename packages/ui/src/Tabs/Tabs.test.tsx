import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Tabs } from './Tabs';

const items = [
  { value: 'one', label: 'One', content: <p>Panel one</p> },
  { value: 'two', label: 'Two', content: <p>Panel two</p> },
  { value: 'three', label: 'Three', content: <p>Panel three</p> },
];

function setup() {
  render(<Tabs items={items} aria-label="Sections" />);
  return userEvent.setup();
}

describe('Tabs', () => {
  it('selects the first tab and shows only its panel', () => {
    setup();
    expect(screen.getByRole('tab', { name: 'One' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Panel one')).toBeVisible();
    expect(screen.queryByText('Panel two')).toBeNull();
    expect(screen.getByRole('tablist', { name: 'Sections' })).toBeInTheDocument();
  });

  it('ArrowRight moves focus and selection to the next tab', async () => {
    const user = setup();
    await user.tab();
    expect(screen.getByRole('tab', { name: 'One' })).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Two' })).toHaveFocus();
    expect(screen.getByRole('tab', { name: 'Two' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Panel two')).toBeVisible();
    expect(screen.queryByText('Panel one')).toBeNull();
  });

  it('ArrowLeft wraps from the first to the last tab', async () => {
    const user = setup();
    await user.tab();
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('tab', { name: 'Three' })).toHaveFocus();
    expect(screen.getByRole('tab', { name: 'Three' })).toHaveAttribute('aria-selected', 'true');
  });

  it('End and Home jump to the last and first tab', async () => {
    const user = setup();
    await user.tab();
    await user.keyboard('{End}');
    expect(screen.getByRole('tab', { name: 'Three' })).toHaveFocus();
    await user.keyboard('{Home}');
    expect(screen.getByRole('tab', { name: 'One' })).toHaveFocus();
  });

  it('honours defaultValue', () => {
    render(<Tabs items={items} defaultValue="two" aria-label="Sections" />);
    expect(screen.getByRole('tab', { name: 'Two' })).toHaveAttribute('aria-selected', 'true');
  });

  it('passes className and ref to the root', () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = render(<Tabs ref={ref} className="custom" items={items} aria-label="Sections" />);
    expect(container.firstElementChild).toHaveClass('custom');
    expect(ref.current).toBe(container.firstElementChild);
  });
});
