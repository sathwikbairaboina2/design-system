import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { deepMerge, flatten, resolveTokens, TokenError, type TokenTree } from '../src/resolve.ts';

const fixture = (name: string): TokenTree =>
  JSON.parse(readFileSync(new URL(`./fixtures/${name}.json`, import.meta.url), 'utf8'));

function codeOf(fn: () => unknown): TokenError {
  try {
    fn();
  } catch (e) {
    return e as TokenError;
  }
  throw new Error('expected TokenError, nothing thrown');
}

describe('resolveTokens', () => {
  it('resolves a 2-hop chain to the primitive', () => {
    const tree: TokenTree = {
      color: {
        $type: 'color',
        blue: { 500: { $value: '#3b82f6' } },
        accent: { $value: '{color.blue.500}' },
        button: { $value: '{color.accent}' },
      },
    };
    expect(resolveTokens(tree).get('color.button')).toEqual({ type: 'color', value: '#3b82f6' });
  });

  it('inherits $type from an ancestor group', () => {
    const tree: TokenTree = { space: { $type: 'dimension', a: { $value: '4px' }, n: { b: { $value: '8px' } } } };
    const flat = flatten(tree);
    expect(flat.get('space.a')?.type).toBe('dimension');
    expect(flat.get('space.n.b')?.type).toBe('dimension');
  });

  it('throws broken-ref naming the token and the reference', () => {
    const e = codeOf(() => resolveTokens(fixture('broken-ref')));
    expect(e).toBeInstanceOf(TokenError);
    expect(e.code).toBe('broken-ref');
    expect(e.message).toContain('token color.bg.surface: reference {color.nope} does not exist');
  });

  it('throws cycle listing the path', () => {
    const e = codeOf(() => resolveTokens(fixture('cycle')));
    expect(e.code).toBe('cycle');
    expect(e.message).toMatch(/color\.a -> color\.b -> color\.a/);
  });

  it('throws unknown-type naming the token', () => {
    const e = codeOf(() => resolveTokens(fixture('bad-type')));
    expect(e.code).toBe('unknown-type');
    expect(e.message).toContain('token thing.x: unknown $type "foo"');
  });

  it('throws missing-type when no ancestor declares one', () => {
    const e = codeOf(() => resolveTokens({ a: { $value: '1' } }));
    expect(e.code).toBe('missing-type');
    expect(e.message).toContain('token a');
  });
});

describe('deepMerge', () => {
  it('overrides a leaf without dropping siblings', () => {
    const base = { c: { a: { $value: '1' }, b: { $value: '2' } } };
    const merged = deepMerge(base, { c: { a: { $value: '9' } } });
    expect(merged).toEqual({ c: { a: { $value: '9' }, b: { $value: '2' } } });
    expect(base.c.a.$value).toBe('1');
  });
});
