import css from '@eslint/css';
import ds from '@ds/eslint-plugin';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import tseslint from 'typescript-eslint';

export default [
  {
    ignores: [
      '**/dist/**',
      '**/dist-incompatible/**',
      '**/storybook-static/**',
      '**/node_modules/**',
      '**/test-results/**',
      '**/playwright-report/**',
      'tests/*/results/**',
    ],
  },
  ...tseslint.configs.recommended.map((c) => ({ ...c, files: ['**/*.{ts,tsx}'] })),
  { ...jsxA11y.flatConfigs.recommended, files: ['**/*.tsx'] },
  {
    files: ['packages/ui/src/**/*.css', 'apps/*/src/**/*.css'],
    language: 'css/css',
    plugins: { css, ds },
    rules: { 'ds/no-raw-design-values': 'error' },
  },
];
