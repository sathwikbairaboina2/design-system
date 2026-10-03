import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';

const pkg = join(import.meta.dirname, '..');
const dist = (f: string) => readFileSync(join(pkg, 'dist', f), 'utf8');

function vars(block: string): Record<string, string> {
  return Object.fromEntries([...block.matchAll(/--([\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
}

describe('token build', () => {
  beforeAll(() => {
    execFileSync(process.execPath, ['scripts/build.ts'], { cwd: pkg, stdio: 'pipe' });
  });

  it('emits :root and a dark selector with variables', () => {
    const css = dist('tokens.css');
    expect(css).toContain(':root {');
    expect(css).toContain('[data-theme="dark"] {');
    expect(css).toContain('--color-bg-surface:');
  });

  it('CSS colour values equal the validator values in both themes (drift guard)', () => {
    const css = dist('tokens.css');
    const [lightBlock, darkBlock] = css.split('[data-theme="dark"] {');
    const resolved = JSON.parse(dist('tokens.json')) as { light: Record<string, string>; dark: Record<string, string> };
    const toVar = (path: string) => path.replaceAll('.', '-').replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
    const light = vars(lightBlock);
    const dark = vars(darkBlock);
    const colours = Object.keys(resolved.light).filter((p) => p.startsWith('color.'));
    expect(colours.length).toBeGreaterThan(20);
    for (const path of colours) expect(light[toVar(path)], path).toBe(resolved.light[path]);
    const darkKeys = Object.keys(dark);
    expect(darkKeys.length).toBeGreaterThan(10);
    for (const key of darkKeys) {
      const path = Object.keys(resolved.dark).find((p) => toVar(p) === key);
      expect(path, key).toBeDefined();
      expect(dark[key], key).toBe(resolved.dark[path!]);
    }
  });

  it('exports typed constants', () => {
    expect(dist('tokens.js')).toMatch(/export const ColorBgSurface\s*=/);
    expect(dist('tokens.d.ts')).toContain('ColorBgSurface');
  });

  it('contrast report has two results per pair', () => {
    const pairs = JSON.parse(readFileSync(join(pkg, 'contrast-pairs.json'), 'utf8')) as unknown[];
    const report = JSON.parse(dist('contrast-report.json')) as unknown[];
    expect(report).toHaveLength(2 * pairs.length);
  });
});
