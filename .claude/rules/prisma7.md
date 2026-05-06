---
description: Prisma conventions — triggers when working with database models, queries, migrations, or the Prisma client
globs: ["prisma/**", "src/generated/prisma/**", "src/lib/prisma.ts", "prisma.config.ts"]
---

# Prisma

This project uses Prisma 7 with the new TypeScript-native client generator.

- **Generator**: `provider = "prisma-client"` with `output = "../src/generated/prisma"` — NOT the old `prisma-client-js`
- **Import path**: `import { PrismaClient } from "@/generated/prisma/client"` — NOT `@prisma/client`
- **Driver adapter**: Uses `@prisma/adapter-pg` (pg driver) — the new client has no binary query engine. The `DATABASE_URL` is passed via `new PrismaPg({ connectionString })` in `src/lib/prisma.ts`.
- **Generated files**: `src/generated/prisma/` is gitignored — regenerate with `npm run prisma:migrate` or `DATABASE_URL=... npx prisma generate`
- **Config file**: `prisma.config.ts` in the project root configures the datasource URL and schema path
- **`@auth/prisma-adapter`** requires `prisma as any` cast since it still types against `@prisma/client`

## Mandatory workflow after any `prisma/schema.prisma` or migration change

Every edit to `prisma/schema.prisma` — and every time migrations are added, reset, or pulled from another branch — MUST be followed by the steps below, in order, before writing or running any code that references the new schema. Skipping any step leaves the client, database, or seed data out of sync with the schema and causes runtime failures.

1. **Create / apply the migration**: `npm run prisma:migrate` — generates the SQL migration (when schema changed), applies pending migrations to the database, and regenerates the client.
2. **Regenerate the client**: `npm run prisma:generate` — required so TypeScript sees the current fields/models. Run this if step 1 was skipped (e.g. when pulling migrations from another branch without editing the schema) or whenever the generated client in `src/generated/prisma/` is stale.
3. **Reseed the database**: `npm run prisma:seed` — ensures required reference data exists after migrations. Always run after `prisma:migrate` or when migrations reset the database.

Run this workflow whenever any of the following occur:

- Editing `prisma/schema.prisma`
- Adding, editing, or deleting files in `prisma/migrations/`
- Pulling or merging changes that touch `prisma/schema.prisma` or `prisma/migrations/`
- Switching branches where the schema or migrations differ
- Resetting the database (`prisma migrate reset`)

Do not commit schema changes without the matching migration file in `prisma/migrations/`. Do not write seed scripts, queries, or application code against new fields until the client has been regenerated.
