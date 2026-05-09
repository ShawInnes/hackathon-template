---
description: TanStack Query conventions — use only when client-side caching, mutations, or polling are required
globs: ["src/components/**", "src/app/**/*.tsx", "src/hooks/**"]
---

# TanStack Query

Server components are the default for data fetching in this app. Reach for `@tanstack/react-query` only when client-side cache, mutations with optimistic UI, polling, infinite scroll, or real-time updates are needed.

## When to use

- Mutations with optimistic UI updates (`useMutation`).
- Polling / refetch on interval (dashboards, queues).
- Infinite scroll / pagination from a client component.
- Cross-component cache for the same resource.

## When to skip

- Initial render data → fetch in a server component, pass via props.
- One-shot fetch on mount with no cache reuse → `useEffect` + `fetch` is enough; don't add a dependency for one call.

## Required setup

```bash
npm install @tanstack/react-query
```

The `QueryClientProvider` lives in `src/components/providers.tsx` (client component, wrapped by `app/layout.tsx`). Reuse it; do not instantiate `QueryClient` per page.

## Pattern

```tsx
"use client"
import { useQuery } from "@tanstack/react-query"
import { TaskList } from "@/lib/schemas/tasks"

export function TaskInbox() {
  const { data } = useQuery({
    queryKey: ["tasks", "inbox"],
    queryFn: async () => {
      const res = await fetch("/api/tasks/inbox")
      return TaskList.parse(await res.json())  // Zod validation at the boundary
    },
    refetchInterval: 30_000,
  })
  // ...
}
```

## Rules

- **Query keys are arrays of stable values.** Keep them in a constant or factory in `src/lib/query-keys.ts` so invalidation stays consistent.
- **Always parse `queryFn` results with Zod.** The wire format is `unknown`.
- **Mutations invalidate the relevant queryKey** — never refetch by reload.
- **Do not use TanStack Query in server components.** It is client-only.

## Anti-patterns

- Using TanStack Query for the initial page load when a server component would do.
- Inline-defined query keys scattered across components — centralise them.
- Skipping Zod parse on `queryFn` — defeats the runtime safety guarantee.
