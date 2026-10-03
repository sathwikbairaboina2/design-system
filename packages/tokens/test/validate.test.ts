import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { deepMerge, type TokenTree } from '../src/resolve.ts';
import { validateTokens } from '../src/validate.ts';

const read = (rel: string) => JSON.parse(readFileSync(new URL(rel, import.meta.url), 'utf8'));
const base: TokenTree = read('../src/base.json');
const dark: TokenTree = read('../src/dark.json');
const pairs: Array<{ fg: string; bg: string; min: number }> = read('../contrast-pairs.json');

describe('validateTokens', () => {
  it('real sources pass every pair in both themes', () => {
    const { contrast, themes } = validateTokens({ base, dark, pairs });
    expect(contrast).toHaveLength(2 * pairs.length);
    expect(contrast.every((c) => c.pass)).toBe(true);
    expect(themes.light.get('color.bg.surface')?.value).toBe('#ffffff');
    expect(themes.dark.get('color.bg.surface')?.value).toBe('#0f172a');
  });

  it('every dark override targets a semantic colour that exists in base', () => {
    const { themes } = validateTokens({ base, dark, pairs });
    for (const name of themes.dark.keys()) expect(themes.light.has(name)).toBe(true);
  });

  it('throws naming fg, bg, theme and ratio when dark contrast is too low', () => {
    const bad = read('./fixtures/bad-contrast-dark.json');
    let message = '';
    try {
      validateTokens({ base, dark: deepMerge(dark, bad), pairs });
    } catch (e) {
      message = (e as Error).message;
    }
    expect(message).toMatch(/^contrast: color\.text\.onAccent on color\.bg\.accent in dark = \d\.\d\d < 4\.5$/m);
  });

  it('throws when a pair names a non-colour token', () => {
    expect(() => validateTokens({ base, dark, pairs: [{ fg: 'space.1', bg: 'color.bg.surface', min: 4.5 }] })).toThrow(
      /space\.1.*not a color/,
    );
  });
});
