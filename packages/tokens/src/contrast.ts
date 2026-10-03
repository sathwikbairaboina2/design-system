/** WCAG 2.2 contrast math for opaque sRGB hex colours. */

export function parseHex(input: string): string {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(input.trim());
  if (!m) throw new Error(`expected an opaque #rrggbb colour, got "${input}"`);
  let h = m[1].toLowerCase();
  if (h.length === 3) h = [...h].map((c) => c + c).join('');
  return `#${h}`;
}

export function relativeLuminance(hex: string): number {
  const h = parseHex(hex).slice(1);
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(h.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}
