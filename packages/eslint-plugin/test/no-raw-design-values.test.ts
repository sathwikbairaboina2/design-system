import { RuleTester } from 'eslint';
import css from '@eslint/css';
import { describe, it } from 'vitest';
import rule from '../src/rules/no-raw-design-values.js';

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const tester = new RuleTester({ plugins: { css }, language: 'css/css' });

const raw = (n: number) => Array.from({ length: n }, () => ({ messageId: 'raw' }));

tester.run('no-raw-design-values', rule, {
  valid: [
    'a { padding: var(--space-2); }',
    'a { margin: 0; }',
    'a { border: 1px solid var(--color-border-default); }',
    'a { color: var(--x, #fff); }',
    'a { width: 100%; }',
    'a { transition-duration: var(--duration-fast); }',
  ],
  invalid: [
    { code: 'a { color: #fff; }', errors: raw(1) },
    { code: 'a { padding: 8px 4px; }', errors: raw(2) },
    { code: 'a { color: rgb(0 0 0); }', errors: raw(1) },
    { code: 'a { box-shadow: 0 2px 4px oklch(0.5 0 0); }', errors: raw(3) },
    { code: 'a { outline: 2px solid var(--color-border-focus); }', errors: raw(1) },
    { code: 'a { padding: 1px; }', errors: raw(1) },
  ],
});
