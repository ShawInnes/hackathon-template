---
description: Enforces Astryx as the default UI component library — triggers when creating or modifying UI components, buttons, cards, inputs, dialogs, dropdowns, or any visual element
globs: ["src/components/**", "src/app/**/*.tsx"]
---

# Astryx First

Always use `@astryxdesign/core` components for UI elements — never raw HTML or a `<div>` for layout/spacing. Before writing any markup for buttons, cards, inputs, dialogs, dropdowns, avatars, or layout containers, discover the component first:

```bash
npx astryx build "<idea>"       # start here — returns the closest page/block/component kit
npx astryx component <Name>     # props + examples for a specific component
npx astryx template <name>      # scaffold or study a page/block recipe
```

Custom styling: use component props first. If no prop covers the need, fall back to Tailwind utility classes backed by tokens (`@astryxdesign/core/tailwind-theme.css`) — never raw hex/px values or inline `style={{}}`.

Never write raw HTML for elements that Astryx covers.
