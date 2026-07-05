---
description: ALWAYS ACTIVE. Conventions for adding new routes (PageLayout + auth()), protecting paths (PROTECTED_PATHS in proxy.ts), and new database models (prisma:migrate).
---

# Adding Features

- **New routes**: Create `src/app/<route>/page.tsx`. Wrap in `<PageLayout>` and call `auth()` at the top.
- **Protect a route**: Add its path to the `PROTECTED_PATHS` array in `src/proxy.ts`.
- **New database model**: Add it to `prisma/schema.prisma` below the comment line, then run `npm run prisma:migrate`.
- **New environment variable**: Add it to the Zod schema in `src/lib/env.ts`, to `.env.example` (placeholder value), and to the README env var table — all in the same change. See `secrets-handling`.
- **Make it reachable**: Link every new route from the navbar, dashboard, or its parent page in the same increment — see `no-orphan-features`.
