// Flags raw design values in CSS declarations: hex colours, colour functions and px lengths.
// Allowed: 0, 1px on border*/outline* properties, anything inside var(...), and %/em/rem/unitless values.
// Out of scope: named colours (e.g. `red`); they would need a keyword list that drifts with the CSS spec.

const COLOUR_FUNCTIONS = new Set(['rgb', 'rgba', 'hsl', 'hsla', 'hwb', 'lab', 'lch', 'oklab', 'oklch', 'color']);

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'problem',
    docs: { description: 'Disallow raw colours and px values in CSS; use token variables.' },
    messages: {
      raw: 'Raw design value "{{value}}" in "{{property}}". Use a token variable (var(--...)).',
    },
    schema: [],
  },
  create(context) {
    return {
      Declaration(declaration) {
        const property = declaration.property;
        if (property.startsWith('--')) return;
        const borderLike = /^(border|outline)/i.test(property);

        const report = (node, value) => context.report({ loc: node.loc, messageId: 'raw', data: { value, property } });

        const visit = (node) => {
          if (!node || typeof node !== 'object') return;
          if (node.type === 'Function') {
            const name = node.name.toLowerCase();
            if (name === 'var') return;
            if (COLOUR_FUNCTIONS.has(name)) return report(node, `${node.name}(...)`);
          } else if (node.type === 'Hash') {
            return report(node, `#${node.value}`);
          } else if (node.type === 'Dimension' && node.unit.toLowerCase() === 'px') {
            const n = Number(node.value);
            if (n === 0) return;
            if (n === 1 && borderLike) return;
            return report(node, `${node.value}px`);
          }
          const children = node.children;
          if (!children) return;
          const list = typeof children.toArray === 'function' ? children.toArray() : Array.from(children);
          for (const child of list) visit(child);
        };

        visit(declaration.value);
      },
    };
  },
};
