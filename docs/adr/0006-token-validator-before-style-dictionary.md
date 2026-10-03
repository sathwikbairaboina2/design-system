# ADR 0006: Our own validator runs before Style Dictionary and fails the build on contrast

Date: 2026-10-04 · Status: accepted

## Decision
Tokens are DTCG JSON: `src/base.json` (primitives and light semantics) and `src/dark.json` (semantic overrides).
`src/validate.ts` resolves references for each theme (`base`, and `base` deep-merged with `dark`), rejects unknown
`$type`s, broken references and cycles, then checks every pair in `contrast-pairs.json` with the WCAG 2.2 relative
luminance formula in both themes. Only then does Style Dictionary 5.6.0 emit `tokens.css` (`:root`, plus
`[data-theme="dark"]` with overrides only), `tokens.js` and `tokens.d.ts`. We write `tokens.json` ourselves from the
validator's resolved values. Errors name the pair, theme, ratio and minimum, for example
`contrast: color.text.onAccent on color.bg.accent in dark = 3.12 < 4.5`.

## What I gave up
- **One resolver.** References are resolved twice, by our validator and by Style Dictionary. A test asserts that the
  CSS values equal the validator's values, so they cannot drift silently.
- **A nested `color.bg.surface` TS object.** The TS output is Style Dictionary's flat constants (`ColorBgSurface`).
- **Alpha-aware contrast.** Colours must be opaque `#rrggbb`; the validator rejects anything else.
