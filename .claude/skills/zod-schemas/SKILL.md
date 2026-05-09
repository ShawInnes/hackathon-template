---
name: zod-schemas
description: Add Zod validation for DTOs, server action inputs, env vars, or external API responses. Use when defining request/response shapes, validating untrusted input, or sharing schemas between client and server.
---

# Zod Schema Skill

Goal: every untrusted boundary in the app has a Zod schema. The schema is the single source of truth — types are derived from it.

## When to invoke this skill

- New API route handler in `src/app/api/**/route.ts`.
- New server action that takes input.
- Adding a form (pair with `tanstack-form`).
- Reading an external API response (LLM, third-party).
- Adding a new env var.

## Steps

1. **Install if needed**: `npm install zod` (only the first time — check `package.json` first).
2. **Create the schema file**: `src/lib/schemas/<feature>.ts`. One file per feature.
3. **Define the schema first, infer the type from it**:

   ```ts
   import { z } from "zod"

   export const CreateTaskInput = z.object({
     title: z.string().min(1).max(200),
     dueAt: z.coerce.date().optional(),
     assigneeId: z.string().cuid(),
   })

   export type CreateTaskInput = z.infer<typeof CreateTaskInput>
   ```

4. **Parse at the boundary**:

   - Server action: `const parsed = CreateTaskInput.safeParse(input)` → return `{ ok: false, errors: parsed.error.flatten() }` on failure.
   - Route handler: same, return a `Response` with status 400 + the flattened errors.
   - External API: `Schema.parse(await res.json())` (throws — the call site catches and surfaces a friendly error).

5. **Share with client forms**: import the same schema in the form component. See `tanstack-form` skill.

## Env var pattern

`src/lib/env.ts`:

```ts
import { z } from "zod"

const Env = z.object({
  DATABASE_URL: z.string().url(),
  AUTH_OIDC_ISSUER: z.string().url(),
})

export const env = Env.parse(process.env)
```

Import `env` everywhere instead of `process.env` — typo-safe + validated.

## Common patterns

| Need | Helper |
|------|--------|
| Coerce string → number from form | `z.coerce.number()` |
| Coerce string → date from form | `z.coerce.date()` |
| Optional + nullable | `.nullish()` |
| Enum from Prisma | `z.nativeEnum(RoleType)` |
| Email | `z.string().email()` |
| Cuid id | `z.string().cuid()` |

## Anti-patterns

- Hand-writing a TS type that mirrors a Zod schema → use `z.infer`.
- Casting `as Foo` to bypass an `unknown` shape → parse with Zod.
- Throwing inside an API handler without a 400 response → return validation errors.

## Verify

- [ ] Schema lives in `src/lib/schemas/<feature>.ts`.
- [ ] Type derived via `z.infer`, not hand-written.
- [ ] Boundary code uses `safeParse` (server actions / routes) or `parse` (external APIs).
- [ ] No duplicate type definitions for the same shape.
