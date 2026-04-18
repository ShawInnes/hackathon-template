---
description: Prisma 7 conventions — triggers when working with database models, queries, migrations, or the Prisma client
globs: ["prisma/**", "src/generated/prisma/**", "src/lib/prisma.ts", "prisma.config.ts"]
---

# Prisma 7

This project uses Prisma 7 with the new TypeScript-native client generator.

- **Generator**: `provider = "prisma-client"` with `output = "../src/generated/prisma"` — NOT the old `prisma-client-js`
- **Import path**: `import { PrismaClient } from "@/generated/prisma/client"` — NOT `@prisma/client`
- **Driver adapter**: Uses `@prisma/adapter-pg` (pg driver) — the new client has no binary query engine. The `DATABASE_URL` is passed via `new PrismaPg({ connectionString })` in `src/lib/prisma.ts`.
- **Generated files**: `src/generated/prisma/` is gitignored — regenerate with `npm run prisma:migrate` or `DATABASE_URL=... npx prisma generate`
- **Config file**: `prisma.config.ts` in the project root configures the datasource URL and schema path
- **`@auth/prisma-adapter`** requires `prisma as any` cast since it still types against `@prisma/client`
