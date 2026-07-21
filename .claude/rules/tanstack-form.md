---
description: TanStack Form + Zod conventions — use when building forms with multi-field validation
globs: ["src/components/**", "src/app/**/*.tsx"]
---

# TanStack Form

Use `@tanstack/react-form` with a Zod adapter for any form with more than two fields, multi-step flows, or non-trivial validation. Pair every form with a Zod schema that is shared between client validation and server parsing.

## When to use

- Forms with 3+ fields.
- Cross-field validation (e.g. password confirmation, conditional required).
- Multi-step or wizard forms.
- Need optimistic UI / dirty / submitting state.

## When to skip

- 1–2 field forms (search box, single text input) → plain `<form action={serverAction}>` with Astryx `<TextInput>` + `<Button>`.

## Required setup

```bash
npm install @tanstack/react-form zod
npx astryx component TextInput
```

## Pattern

```tsx
"use client"
import { useForm } from "@tanstack/react-form"
import { TextInput } from "@astryxdesign/core/TextInput"
import { CreateTaskInput } from "@/lib/schemas/tasks"

export function CreateTaskForm({ action }: { action: (i: unknown) => Promise<void> }) {
  const form = useForm({
    defaultValues: { title: "", assigneeId: "" },
    validators: { onSubmit: CreateTaskInput },
    onSubmit: async ({ value }) => action(value),
  })

  return (
    <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit() }}>
      <form.Field name="title">
        {(field) => (
          <TextInput
            label="Title"
            value={field.state.value}
            onChange={(value) => field.handleChange(value)}
            status={field.state.meta.errors.length ? { type: "error", message: field.state.meta.errors[0] } : undefined}
          />
        )}
      </form.Field>
    </form>
  )
}
```

## Schema sharing rule

The same Zod schema MUST validate both client + server. Define once in `src/lib/schemas/<feature>.ts`, import on both sides. See `zod-schemas` rule.

## Anti-patterns

- Reimplementing `useState` + `onChange` for every field — use `<form.Field>`.
- Duplicating validation logic on client and server — share the Zod schema.
- Catching submit errors silently — surface them via `form.state.errors`.
