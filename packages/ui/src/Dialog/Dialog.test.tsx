import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ThemeProvider } from '../ThemeProvider/ThemeProvider';
import { Dialog } from './Dialog';

function Example() {
  return (
    <>
      <button type="button">Before</button>
      <Dialog trigger={<button type="button">Open</button>} title="Confirm payment" description="This charges your card.">
        <input aria-label="Name" />
        <button type="button">Confirm</button>
      </Dialog>
    </>
  );
}

describe('Dialog', () => {
  it('opens on trigger click with an accessible name and description', async () => {
    const user = userEvent.setup();
    render(<Example />);
    expect(screen.queryByRole('dialog')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Open' }));
    const dialog = screen.getByRole('dialog', { name: 'Confirm payment' });
    expect(dialog).toHaveAccessibleDescription('This charges your card.');
  });

  it('moves focus inside, traps Tab, closes on Escape and restores focus to the trigger', async () => {
    const user = userEvent.setup();
    render(<Example />);
    const trigger = screen.getByRole('button', { name: 'Open' });
    await user.click(trigger);
    const dialog = screen.getByRole('dialog');
    expect(dialog.contains(document.activeElement)).toBe(true);
    expect(document.activeElement).toBe(screen.getByLabelText('Name'));

    for (let i = 0; i < 6; i += 1) {
      await user.tab();
      expect(dialog.contains(document.activeElement), `after Tab ${i + 1}`).toBe(true);
    }
    await user.tab({ shift: true });
    expect(dialog.contains(document.activeElement)).toBe(true);

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('closes through the Close button', async () => {
    const user = userEvent.setup();
    render(<Example />);
    await user.click(screen.getByRole('button', { name: 'Open' }));
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('keeps dark tokens inside the dialog by portalling into the ThemeProvider root', async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider theme="dark">
        <Example />
      </ThemeProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'Open' }));
    expect(screen.getByRole('dialog').closest('[data-theme]')).toHaveAttribute('data-theme', 'dark');
  });
});
