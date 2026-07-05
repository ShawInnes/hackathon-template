---
description: Zod is the single source of truth for DTOs, server action inputs, env vars, and external API response shapes — always-active
---

# Zod Schemas & Type Safety

Zod is the project's runtime + compile-time type system for data crossing any boundary. TypeScript types alone do not validate at runtime — Zod does.

## When to use Zod (mandatory)

- **API route handlers** (`src/app/api/**/route.ts`) — parse `request.json()` with `Schema.safeParse(...)`. Never trust the body shape.
- **Server actions** — parse the input argument before touching the database.
- **External API responses** — fetch responses are typed `unknown`; pipe them through Zod before use.
- **Form submissions** — share the same schema between client form validation and server-side parsing (see `tanstack-form` rule).
- **Environment variables** — parse `process.env` once at module load in `src/lib/env.ts`. When adding a var here, also add it to `.env.example` and the README env table in the same change (see `secrets-handling`).

## When to skip

- Internal function arguments inside the same module/feature where TypeScript already guarantees the shape.
- Prisma query results — Prisma's generated types are authoritative.

## Single source of truth pattern

Define the schema first, derive the TypeScript type from it. Never hand-write a duplicate type.

```ts
import { z } from "zod"

export const CreateTaskInput = z.object({
  title: z.string().min(1).max(200),
  dueAt: z.coerce.date().optional(),
  assigneeId: z.string().cuid(),
})

export type CreateTaskInput = z.infer<typeof CreateTaskInput>
```

## File layout

- Co-locate schemas with the feature: `src/lib/schemas/<feature>.ts`
- Cross-cutting schemas (env, shared DTOs): `src/lib/schemas/`
- Export both the schema (PascalCase) and inferred type (same name) — TS namespaces them separately.

## Server action parsing

```ts
"use server"
import { CreateTaskInput } from "@/lib/schemas/tasks"

export async function createTask(input: unknown) {
  const parsed = CreateTaskInput.safeParse(input)
  if (!parsed.success) {
    return { ok: false as const, errors: parsed.error.flatten() }
  }
  // parsed.data is fully typed
}
```

## Anti-patterns

- Hand-written TS types that mirror a Zod schema — derive with `z.infer` instead.
- `as` casts to bypass an unknown shape — parse with Zod.
- Throwing on parse failure inside route handlers without a 400 response — return validation errors to the caller.
