import { describe, expect, it } from 'vitest';
import { contrastRatio, parseHex } from '../src/contrast.ts';

describe('contrastRatio', () => {
  it('black on white is 21', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 2);
  });
  it('matches known WCAG values', () => {
    expect(contrastRatio('#767676', '#ffffff')).toBeCloseTo(4.54, 2);
    expect(contrastRatio('#777777', '#ffffff')).toBeCloseTo(4.48, 2);
    expect(contrastRatio('#1d4ed8', '#ffffff')).toBeCloseTo(6.7, 2);
  });
  it('is order independent', () => {
    expect(contrastRatio('#1d4ed8', '#ffffff')).toBe(contrastRatio('#ffffff', '#1d4ed8'));
  });
});

describe('parseHex', () => {
  it('expands #abc', () => {
    expect(parseHex('#abc')).toBe('#aabbcc');
  });
  it('rejects alpha and named colours', () => {
    expect(() => parseHex('#11223380')).toThrow(/opaque #rrggbb/);
    expect(() => parseHex('red')).toThrow(/opaque #rrggbb/);
  });
});
