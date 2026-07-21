---
name: tanstack-table
description: Build a data table with sort, filter, pagination, or row selection using TanStack Table layered on Astryx's Table component. Use when adding any non-trivial table UI.
---

# TanStack Table Skill

Goal: scaffold a robust data table without the user needing to learn TanStack Table internals. Headless logic from `@tanstack/react-table`, markup from Astryx `<Table>`, state synced to the URL.

## When to invoke

- Listing more than ~10 rows AND need sort, filter, pagination, or selection.
- Mixed column types (status badges, dates, action menus).

## When NOT to invoke

- Static <10 row tables → use plain Astryx `<Table>` with its data-driven `columns` prop directly (no TanStack Table needed).
- Read-only summary with no interaction.

## Steps

1. **Check first**: does `src/components/data-table.tsx` exist? If yes, extend it. Do not re-implement.

2. **Install if needed**:

   ```bash
   npm install @tanstack/react-table
   npx astryx component Table
   ```

3. **Create the shared `<DataTable />` wrapper** (only once, first time):

   ```tsx
   "use client"
   // src/components/data-table.tsx
   import {
     ColumnDef,
     flexRender,
     getCoreRowModel,
     getPaginationRowModel,
     getSortedRowModel,
     useReactTable,
   } from "@tanstack/react-table"
   import { Table, proportional, type TableColumn } from "@astryxdesign/core/Table"

   interface DataTableProps<T extends Record<string, unknown>> {
     columns: ColumnDef<T>[]
     data: T[]
   }

   export function DataTable<T extends Record<string, unknown>>({ columns, data }: DataTableProps<T>) {
     const table = useReactTable({
       data,
       columns,
       getCoreRowModel: getCoreRowModel(),
       getSortedRowModel: getSortedRowModel(),
       getPaginationRowModel: getPaginationRowModel(),
     })

     const rows = table.getRowModel().rows

     // Astryx's renderCell receives only the row item, so cells are matched back
     // to a TanStack row by reference and rendered through flexRender.
     const astryxColumns: TableColumn<T>[] = table.getFlatHeaders().map((header) => ({
       key: header.id,
       header: String(header.column.columnDef.header),
       width: proportional(1),
       renderCell: (item: T) => {
         const cell = rows
           .find((r) => r.original === item)
           ?.getVisibleCells()
           .find((c) => c.column.id === header.column.id)
         return cell ? flexRender(cell.column.columnDef.cell, cell.getContext()) : null
       },
     }))

     return <Table data={rows.map((r) => r.original)} columns={astryxColumns} />
   }
   ```

4. **Define columns next to the page**: `src/app/<feature>/columns.ts`.

   ```ts
   import { ColumnDef } from "@tanstack/react-table"
   import type { Task } from "@/generated/prisma/client"

   export const taskColumns: ColumnDef<Task>[] = [
     { accessorKey: "title", header: "Title" },
     { accessorKey: "status", header: "Status" },
     { accessorKey: "dueAt", header: "Due", cell: ({ row }) => row.original.dueAt?.toLocaleDateString() ?? "—" },
   ]
   ```

5. **Render** in the page (server component fetches, client component holds the table):

   ```tsx
   // src/app/tasks/page.tsx (server)
   import { prisma } from "@/lib/prisma"
   import { DataTable } from "@/components/data-table"
   import { taskColumns } from "./columns"

   export default async function TasksPage() {
     const tasks = await prisma.task.findMany()
     return <DataTable columns={taskColumns} data={tasks} />
   }
   ```

6. **URL-driven state**: when adding sort/filter/pagination, lift the state into `useSearchParams` + `router.replace`. Required by `ui-url-driven-navigation` rule. Do not hold pagination only in `useState`.

## Anti-patterns

- Re-implementing `useReactTable` per page — extend `<DataTable />`.
- Pagination state only in `useState` — must reflect in URL.
- Fetching data inside row cells — pass full row objects.

## Verify

- [ ] `<DataTable />` is reused, not duplicated.
- [ ] Columns typed as `ColumnDef<RowType>[]`.
- [ ] Sort / filter / page state in URL search params.
- [ ] No `any` types in column definitions.
