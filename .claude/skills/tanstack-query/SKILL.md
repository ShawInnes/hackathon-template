---
name: tanstack-query
description: Add client-side data caching, mutations, polling, or infinite scroll using TanStack Query. Use only when server components are insufficient (mutations with optimistic UI, polling, real-time, cross-component cache).
---

# TanStack Query Skill

Goal: opinionated client-side data layer for the cases where server components don't fit. Default is still server components — only reach for this skill when the data is truly client-driven.

## When to invoke

- Mutations with optimistic UI (`useMutation`).
- Polling on interval (queues, dashboards).
- Infinite scroll / cursor pagination from a client component.
- Multiple components reading the same resource and benefiting from cache.

## When NOT to invoke

- Initial data load → server component + props.
- One-shot client fetch on mount with no reuse → don't add a dependency for one call.
- Anything inside a server component — TanStack Query is client-only.

## Steps

1. **Install if needed**:

   ```bash
   npm install @tanstack/react-query
   ```

2. **Create the provider once** at `src/components/providers.tsx`:

   ```tsx
   "use client"
   import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
   import { useState } from "react"

   export function Providers({ children }: { children: React.ReactNode }) {
     const [client] = useState(() => new QueryClient({
       defaultOptions: { queries: { staleTime: 30_000 } },
     }))
     return <QueryClientProvider client={client}>{children}</QueryClientProvider>
   }
   ```

3. **Wrap the app** in `src/app/layout.tsx`:

   ```tsx
   import { Providers } from "@/components/providers"
   // <body><Providers>{children}</Providers></body>
   ```

4. **Centralise query keys** at `src/lib/query-keys.ts`:

   ```ts
   export const queryKeys = {
     tasks: {
       all: ["tasks"] as const,
       inbox: ["tasks", "inbox"] as const,
       byId: (id: string) => ["tasks", id] as const,
     },
   }
   ```

5. **Pair every `queryFn` with a Zod parse** (use `zod-schemas` skill):

   ```tsx
   "use client"
   import { useQuery } from "@tanstack/react-query"
   import { TaskList } from "@/lib/schemas/tasks"
   import { queryKeys } from "@/lib/query-keys"

   export function TaskInbox() {
     const { data, isPending } = useQuery({
       queryKey: queryKeys.tasks.inbox,
       queryFn: async () => {
         const res = await fetch("/api/tasks/inbox")
         if (!res.ok) throw new Error("Failed to load tasks")
         return TaskList.parse(await res.json())
       },
       refetchInterval: 30_000,
     })
     // ...
   }
   ```

6. **Mutations invalidate keys** — never reload:

   ```tsx
   const qc = useQueryClient()
   const mutation = useMutation({
     mutationFn: async (input: CreateTaskInput) => { /* ... */ },
     onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.tasks.all }),
   })
   ```

## Anti-patterns

- TanStack Query in a server component — it's client-only.
- Inline query keys scattered everywhere — centralise.
- Skipping Zod parse on `queryFn` — defeats runtime safety.
- Reloading the page after a mutation — invalidate the query key instead.

## Verify

- [ ] `Providers` wraps the app once in `layout.tsx`.
- [ ] Query keys live in `src/lib/query-keys.ts`.
- [ ] Every `queryFn` parses its result with Zod.
- [ ] Mutations call `invalidateQueries` on success.
- [ ] No `useQuery` calls in server components.
