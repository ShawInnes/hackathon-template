---
description: Conventions for adding new routes, protected paths, and database models — triggers when creating new pages, API routes, or Prisma schema changes
globs: ["src/app/**", "prisma/schema.prisma", "src/proxy.ts"]
---

# Adding Features

- **New routes**: Create `src/app/<route>/page.tsx`. Wrap in `<PageLayout>` and call `auth()` at the top.
- **Protect a route**: Add its path to the `PROTECTED_PATHS` array in `src/proxy.ts`.
- **New database model**: Add it to `prisma/schema.prisma` below the comment line, then run `npm run prisma:migrate`.
