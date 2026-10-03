/** DTCG token tree: flatten, merge and resolve `{a.b.c}` references. */

export type TokenTree = { [key: string]: unknown };
export type TokenCode = 'unknown-type' | 'missing-type' | 'broken-ref' | 'cycle' | 'contrast';

export class TokenError extends Error {
  code: TokenCode;
  constructor(code: TokenCode, message: string) {
    super(message);
    this.name = 'TokenError';
    this.code = code;
  }
}

export const ALLOWED_TYPES = ['color', 'dimension', 'fontFamily', 'fontWeight', 'number', 'duration', 'shadow'];

const REF = /^\{([^{}]+)\}$/;

function isObject(v: unknown): v is TokenTree {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export function flatten(tree: TokenTree): Map<string, { type: string; value: unknown }> {
  const out = new Map<string, { type: string; value: unknown }>();
  const walk = (node: TokenTree, path: string[], inherited: string | undefined) => {
    const type = typeof node.$type === 'string' ? node.$type : inherited;
    if ('$value' in node) {
      const name = path.join('.');
      if (type === undefined) throw new TokenError('missing-type', `token ${name}: no $type on the token or any group above it`);
      if (!ALLOWED_TYPES.includes(type)) throw new TokenError('unknown-type', `token ${name}: unknown $type "${type}"`);
      out.set(name, { type, value: node.$value });
      return;
    }
    for (const [key, child] of Object.entries(node)) {
      if (key.startsWith('$') || !isObject(child)) continue;
      walk(child, [...path, key], type);
    }
  };
  walk(tree, [], undefined);
  return out;
}

export function deepMerge(base: TokenTree, override: TokenTree): TokenTree {
  const out: TokenTree = { ...base };
  for (const [key, value] of Object.entries(override)) {
    const current = out[key];
    out[key] = isObject(current) && isObject(value) && !('$value' in value) ? deepMerge(current, value) : value;
  }
  return out;
}

function stringify(value: unknown): string {
  return typeof value === 'string' ? value : JSON.stringify(value);
}

export function resolveTokens(tree: TokenTree): Map<string, { type: string; value: string }> {
  const flat = flatten(tree);
  const resolved = new Map<string, { type: string; value: string }>();

  const resolve = (name: string, stack: string[]): string => {
    const done = resolved.get(name);
    if (done) return done.value;
    const token = flat.get(name);
    if (!token) throw new TokenError('broken-ref', `token ${stack[stack.length - 1] ?? name}: reference {${name}} does not exist`);
    if (stack.includes(name)) throw new TokenError('cycle', `cycle: ${[...stack.slice(stack.indexOf(name)), name].join(' -> ')}`);
    const ref = typeof token.value === 'string' ? REF.exec(token.value) : null;
    const value = ref ? resolve(ref[1], [...stack, name]) : stringify(token.value);
    resolved.set(name, { type: token.type, value });
    return value;
  };

  for (const name of flat.keys()) resolve(name, []);
  return resolved;
}
