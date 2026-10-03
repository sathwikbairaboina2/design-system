# ADR 0005: `@sathwik/ui` supports React 19 only

Date: 2026-10-04 · Status: accepted

## Decision
Peer range `react` and `react-dom` `^19.0.0`; development pinned to 19.3.0. Radix Dialog 1.1.23 and Tabs 1.1.21,
Storybook 10.6.1 and Testing Library 16.3.3 all accept React 19. The federation shared config uses `^19.0.0`.

## What I gave up
- **React 18 consumers.** A host on React 18 cannot share our singleton; it would need a second React.
- **Testing two majors.** No CI matrix over React versions.
