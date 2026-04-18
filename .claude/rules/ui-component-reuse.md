---
description: Enforces component extraction and reuse — triggers when building UI features or adding new visual elements
globs: ["src/components/**", "src/app/**/*.tsx"]
---

# Component Reuse

Before implementing any feature with a UI element, ask: should this be a reusable component in `src/components/`?

If the element will appear in more than one place, or if extracting it would make the page cleaner, create a component. Use `/create-nextjs-component` to scaffold it.
