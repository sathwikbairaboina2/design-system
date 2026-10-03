import '@sathwik/tokens/tokens.css';
import './preview.css';
import type { Preview } from '@storybook/react-vite';
import { ThemeProvider } from '@sathwik/ui';
import { useEffect } from 'react';

const preview: Preview = {
  globalTypes: {
    theme: {
      description: 'Colour theme',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: 'light' },
  parameters: { layout: 'padded' },
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme === 'dark' ? 'dark' : 'light';
      // Set synchronously too, so the first paint and the e2e/a11y assertions see the right theme.
      document.documentElement.dataset.theme = theme;
      useEffect(() => {
        document.documentElement.dataset.theme = theme;
      }, [theme]);
      return (
        <ThemeProvider theme={theme}>
          <Story />
        </ThemeProvider>
      );
    },
  ],
};

export default preview;
