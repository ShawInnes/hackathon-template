---
description: Use Interior as the default source of micro-interaction patterns, adapted to Astryx components and tokens
globs: ["src/components/**", "src/app/**/*.tsx"]
---

# Interior micro-interactions

Read https://www.interior.dev/docs/ before building motion or interaction feedback.
Interior provides copyable source files, not an npm component library. `motion` is
already a dependency; import from `motion/react`. Do not install an imagined Interior
package or replace Astryx with shadcn UI.

## Discovery and ownership

1. Discover the Astryx primitive first (`npx astryx build "<idea>"`).
2. Find the matching Interior pattern and read its usage, source, and props. Start
   with Copy Button, Loading Button, Skeleton Swap, Value Flash, or Reorder List when
   they match the feature.
3. Search `src/components/` for an existing implementation before copying source.
4. Save adapted source in `src/components/interior/<pattern>.tsx`, with the original
   docs URL in a comment; import it through `@/components/interior/...`.

Manual copying is preferred here: the docs also offer shadcn registry URLs, but
registry output still needs adaptation to this app's design system. Add only the
patterns the feature uses.

## Integration rules

- Astryx owns layout, controls, and visual styling. Reuse its primitives and props;
  use token-backed utilities for gaps. Replace demo raw wrappers, hardcoded colors,
  dimensions, arbitrary utilities, and inline styles rather than copying them.
- Check Astryx's documented prop/ref support before animating a custom component.
  Preserve the underlying control's semantics and focus behavior.
- Use `"use client"` only at interactive leaves. Keep pages/layouts on the server
  where possible, and pass data/actions from the feature container through props.
- Preserve reduced-motion behavior with `useReducedMotion`: show the final state
  and feedback even when movement is disabled.
- Reserve dimensions for all states, allow transitions to respond to repeated
  input, clean up timers/listeners on unmount, and prevent duplicate async actions.
- Preserve keyboard operation, focus management, accessible names, live status
  announcements, and explicit failure feedback. Do not rely on motion alone.
- Verify keyboard use, reduced motion, rapid input, async success/failure, and
  unmount behavior when adapting source.
