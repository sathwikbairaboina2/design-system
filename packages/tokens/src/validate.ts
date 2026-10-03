import { contrastRatio } from './contrast.ts';
import { deepMerge, resolveTokens, TokenError, type TokenTree } from './resolve.ts';

export interface ContrastPair {
  fg: string;
  bg: string;
  min: number;
}

export interface ContrastResult {
  fg: string;
  bg: string;
  theme: 'light' | 'dark';
  ratio: number;
  min: number;
  pass: boolean;
}

type Resolved = Map<string, { type: string; value: string }>;

export function validateTokens(input: { base: TokenTree; dark: TokenTree; pairs: ContrastPair[] }): {
  themes: { light: Resolved; dark: Resolved };
  contrast: ContrastResult[];
} {
  const themes = {
    light: resolveTokens(input.base),
    dark: resolveTokens(deepMerge(input.base, input.dark)),
  };
  const contrast: ContrastResult[] = [];
  for (const theme of ['light', 'dark'] as const) {
    for (const pair of input.pairs) {
      const colours = [pair.fg, pair.bg].map((name) => {
        const token = themes[theme].get(name);
        if (!token) throw new TokenError('contrast', `contrast pair names unknown token ${name}`);
        if (token.type !== 'color') throw new TokenError('contrast', `contrast pair token ${name} is not a color (${token.type})`);
        return token.value;
      });
      const ratio = contrastRatio(colours[0], colours[1]);
      contrast.push({ ...pair, theme, ratio, pass: ratio >= pair.min });
    }
  }
  const failing = contrast.filter((c) => !c.pass);
  if (failing.length > 0) {
    const lines = failing.map((c) => `contrast: ${c.fg} on ${c.bg} in ${c.theme} = ${c.ratio.toFixed(2)} < ${c.min}`);
    throw new TokenError('contrast', lines.join('\n'));
  }
  return { themes, contrast };
}
