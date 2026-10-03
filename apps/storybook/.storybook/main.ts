import path from 'node:path';
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  framework: '@storybook/react-vite',
  stories: ['../stories/**/*.stories.tsx'],
  addons: ['@storybook/addon-a11y', '@storybook/addon-docs'],
  viteFinal: async (viteConfig) => {
    // Test the source (CSS Modules included) rather than the built bundle.
    viteConfig.resolve = {
      ...viteConfig.resolve,
      alias: {
        ...(viteConfig.resolve?.alias as Record<string, string> | undefined),
        '@sathwik/ui': path.resolve(import.meta.dirname, '../../../packages/ui/src/index.ts'),
      },
    };
    return viteConfig;
  },
};

export default config;
