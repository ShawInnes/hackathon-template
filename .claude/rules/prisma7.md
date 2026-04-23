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

## Mandatory workflow after any `prisma/schema.prisma` change

Every edit to `prisma/schema.prisma` MUST be followed by both steps below, in order, before writing or running any code that references the new schema. Skipping either step leaves the client and database out of sync with the schema and causes runtime failures.

1. **Create a migration**: `npm run prisma:migrate` — generates the SQL migration, applies it to the database, and regenerates the client.
2. **Regenerate the client** (only if you did not run `prisma:migrate`): `DATABASE_URL=... npx prisma generate` — required so TypeScript sees the new fields/models.

Do not commit schema changes without the matching migration file in `prisma/migrations/`. Do not write seed scripts, queries, or application code against new fields until the client has been regenerated.
