---
description: Scroll container and message rendering patterns for UI components
globs: ["src/components/**", "src/app/**/*.tsx"]
---

# Scroll Containers & Message Rendering

## Flex scroll containers

Always add `min-h-0` to any flex child that contains a scroll area. `flex-1` alone does not constrain height — without `min-h-0`, the element's default `min-height: auto` allows it to grow past its container and overflow instead of scroll.

```tsx
// Correct
<ScrollArea className="flex-1 min-h-0 ...">

// Wrong — content overflows the panel
<ScrollArea className="flex-1 ...">
```

## Rendering LLM / markdown content

Always render LLM responses with `react-markdown` (or equivalent). Never render as raw text — `{text}` will display `**bold**` and other markdown syntax literally.

```tsx
import ReactMarkdown from "react-markdown"

// Correct
<ReactMarkdown>{text}</ReactMarkdown>

// Wrong
{text}
```

Apply `prose prose-sm` Tailwind typography classes to the container for correct heading, list, and inline code styling. Requires `@tailwindcss/typography` plugin.
