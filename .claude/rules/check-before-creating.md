---
description: ALWAYS ACTIVE. Before creating any new component, utility, hook, or feature — search the codebase to verify it does not already exist. Prevents duplication.
---

# Check Before Creating

Before implementing any new component, utility, hook, route, or feature:

1. **Search the codebase** for existing implementations that match or overlap with what you are about to create.
2. **Check `src/components/`** for UI components that could be reused or extended.
3. **Check `src/lib/`** for utilities and helpers that already solve the problem.
4. **Check `src/hooks/`** for existing custom hooks.
5. **Check shadcn/ui** for primitives that cover the requirement before building from scratch.

If a suitable implementation exists, reuse or extend it. Do not create a duplicate.
