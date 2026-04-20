---
description: Enforces shadcn/ui as the default UI primitive library — triggers when creating or modifying UI components, buttons, cards, inputs, dialogs, dropdowns, or any visual element
globs: ["src/components/**", "src/app/**/*.tsx"]
---

# shadcn/ui First

Always use shadcn/ui primitives for UI elements. Before writing any custom markup for buttons, cards, inputs, dialogs, dropdowns, avatars, or separators — install the shadcn component first:

```bash
npx shadcn add <component-name>
```

Never write raw HTML for elements that shadcn covers.
