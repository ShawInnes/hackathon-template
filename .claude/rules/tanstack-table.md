---
description: TanStack Table conventions — use when building data tables with sorting, filtering, pagination, or selection
globs: ["src/components/**", "src/app/**/*.tsx"]
---

# TanStack Table

Use `@tanstack/react-table` (headless) layered on the shadcn/ui `Table` primitive whenever a table needs sort, filter, pagination, row selection, or column visibility. It is headless — it manages state, not markup, so styling stays in shadcn + Tailwind.

## When to use

- More than ~10 rows AND any of: sorting, filtering, pagination, row selection.
- Mixed column types (dates, status badges, action menus).
- Need column visibility toggles or resizing.

## When to skip

- Under 10 static rows with no interaction → plain shadcn `<Table>` is fine.
- One-off summary tables with hardcoded headers.

## Required setup

```bash
npm install @tanstack/react-table
npx shadcn add table
```

A reusable `<DataTable />` wrapper lives in `src/components/data-table.tsx`. Always extend that wrapper rather than re-implementing `useReactTable` per page.

## Column definitions

Type columns explicitly with `ColumnDef<RowType>`:

```ts
import { ColumnDef } from "@tanstack/react-table"

export const taskColumns: ColumnDef<Task>[] = [
  { accessorKey: "title", header: "Title" },
  { accessorKey: "status", header: "Status" },
]
```

Co-locate columns next to the page that uses them: `src/app/tasks/columns.ts`.

## URL-driven state (mandatory)

Sort, filter, and pagination state MUST sync with the URL — see `ui-url-driven-navigation`. Use `useSearchParams` + `router.replace()` to mirror table state. Never hold pagination only in `useState`.

## Anti-patterns

- Building a custom hook around `useReactTable` per feature — extend the shared `<DataTable />`.
- Holding pagination/sort state only in `useState`.
- Fetching inside row components — pass full row objects via props.
