---
name: tanstack-form
description: Build a typed, validated form using TanStack Form + Zod + Astryx primitives. Use when adding any form with 3+ fields or non-trivial validation.
---

# TanStack Form Skill

Goal: forms that share validation between client and server via a single Zod schema, without the user needing to wire `useState`/`onChange` per field.

## When to invoke

- 3+ fields.
- Cross-field validation (password match, conditional required).
- Multi-step / wizard.
- Need dirty / submitting / error state surfaced.

## When NOT to invoke

- 1–2 fields → plain `<form action={serverAction}>` with Astryx `<TextInput>` + `<Button>`.

## Steps

1. **Install if needed**:

   ```bash
   npm install @tanstack/react-form zod
   npx astryx component TextInput
   ```

2. **Create / locate the Zod schema** (use the `zod-schemas` skill). Schema lives in `src/lib/schemas/<feature>.ts`. Both this form AND the server action import the same schema.

3. **Create the form component** under `src/components/<feature>/<feature>-form.tsx`:

   ```tsx
   "use client"
   import { useForm } from "@tanstack/react-form"
   import { TextInput } from "@astryxdesign/core/TextInput"
   import { Button } from "@astryxdesign/core/Button"
   import { VStack } from "@astryxdesign/core/Stack"
   import { CreateTaskInput } from "@/lib/schemas/tasks"

   interface Props {
     action: (input: CreateTaskInput) => Promise<{ ok: boolean; errors?: unknown }>
   }

   export function CreateTaskForm({ action }: Props) {
     const form = useForm({
       defaultValues: { title: "", assigneeId: "" } as CreateTaskInput,
       validators: { onSubmit: CreateTaskInput },
       onSubmit: async ({ value }) => {
         const result = await action(value)
         if (!result.ok) throw new Error("submit failed")
       },
     })

     return (
       <form
         onSubmit={(e) => {
           e.preventDefault()
           form.handleSubmit()
         }}
       >
         <VStack gap={4}>
           <form.Field name="title">
             {(field) => (
               <TextInput
                 label="Title"
                 value={field.state.value}
                 onChange={(value) => field.handleChange(value)}
                 status={
                   field.state.meta.errors.length
                     ? { type: "error", message: field.state.meta.errors.join(", ") }
                     : undefined
                 }
               />
             )}
           </form.Field>

           <Button type="submit" isLoading={form.state.isSubmitting}>
             Save
           </Button>
         </VStack>
       </form>
     )
   }
   ```

4. **Server action** (in `src/app/<feature>/actions.ts`) parses the same schema:

   ```ts
   "use server"
   import { CreateTaskInput } from "@/lib/schemas/tasks"

   export async function createTask(input: unknown) {
     const parsed = CreateTaskInput.safeParse(input)
     if (!parsed.success) {
       return { ok: false as const, errors: parsed.error.flatten() }
     }
     // parsed.data is fully typed
     return { ok: true as const }
   }
   ```

5. **Pass the action down** as a prop from the page server component:

   ```tsx
   import { createTask } from "./actions"
   import { CreateTaskForm } from "@/components/tasks/create-task-form"

   export default function NewTaskPage() {
     return <CreateTaskForm action={createTask} />
   }
   ```

## Anti-patterns

- Reimplementing `useState` per field — use `<form.Field>`.
- Duplicating validation client + server — share the Zod schema.
- Catching submit errors silently — surface via `form.state` or throw.

## Verify

- [ ] Schema file in `src/lib/schemas/<feature>.ts` is the only validation source.
- [ ] Both form and server action import the same schema.
- [ ] Field errors render to the user.
- [ ] Submit button disabled during `form.state.isSubmitting`.
