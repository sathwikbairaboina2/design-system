# ADR 0007: CSS Modules, a custom @eslint/css rule, ESLint 9 and TypeScript 6

Date: 2026-10-04 · Status: accepted

## Decision
- Components style with CSS Modules that use only `var(--token)` values. Vite library mode bundles them into one
  `dist/index.css`, which consumers import once as `@sathwik/ui/styles.css`.
- `@ds/eslint-plugin` ships `no-raw-design-values`, a rule for the `@eslint/css` language. Hex colours, colour
  functions and px values (other than `0` and `1px` on `border*`/`outline*`) are errors. Tested with `RuleTester`.
- ESLint 9.39.5 with `@eslint/css` 1.4.0, typescript-eslint 8.71.0 and eslint-plugin-jsx-a11y 6.10.2, on
  TypeScript 6.0.3. ESLint 10 and TypeScript 7 exist, but typescript-eslint needs `typescript <6.1.0`, and jsx-a11y
  peers only up to ESLint 9.

## What I gave up
- **Newest majors.** TypeScript 7's faster compiler, and ESLint 10.
- **One-off values.** A pixel tweak needs a token, or a lint disable with a reason.
- **CSS-in-JS ergonomics.** No props-driven styles; variants are class names.
