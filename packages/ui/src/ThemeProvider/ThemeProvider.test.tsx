import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ThemeProvider, useTheme } from './ThemeProvider';

function Probe() {
  const { theme, container } = useTheme();
  return <span data-testid="probe">{`${theme}:${container?.getAttribute('data-theme')}`}</span>;
}

describe('ThemeProvider', () => {
  it('sets data-theme on its root', () => {
    render(
      <ThemeProvider theme="dark" data-testid="root">
        x
      </ThemeProvider>,
    );
    expect(screen.getByTestId('root')).toHaveAttribute('data-theme', 'dark');
  });

  it('exposes theme and its container element through context', () => {
    render(
      <ThemeProvider theme="dark">
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('probe')).toHaveTextContent('dark:dark');
  });
});
