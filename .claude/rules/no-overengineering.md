---
description: ALWAYS ACTIVE. No overengineering — keep code simple, no premature abstractions, no unnecessary error handling, delete unused code.
---

# No Overengineering

- Do not add complex error handling, fallbacks, or validation unless explicitly requested.
- No premature abstractions. Three similar lines is better than a premature helper.
- No feature flags, backwards-compatibility shims, or dead code paths.
- Delete unused code completely — no `// removed`, no commented-out blocks, no unused `_` variables kept for reference.
- Trust internal code and framework guarantees. Only validate at system boundaries (user input, external APIs).
- If a simpler approach works, use it. Complexity must be justified by a concrete requirement, not a hypothetical future one.
