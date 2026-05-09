---
name: tanstack-table
description: Build a data table with sort, filter, pagination, or row selection using TanStack Table layered on shadcn/ui. Use when adding any non-trivial table UI.
---

# TanStack Table Skill

Goal: scaffold a robust data table without the user needing to learn TanStack Table internals. Headless logic from `@tanstack/react-table`, markup from shadcn `<Table>`, state synced to the URL.

## When to invoke

- Listing more than ~10 rows AND need sort, filter, pagination, or selection.
- Mixed column types (status badges, dates, action menus).

## When NOT to invoke

- Static <10 row tables → use plain shadcn `<Table>`.
- Read-only summary with no interaction.

## Steps

1. **Check first**: does `src/components/data-table.tsx` exist? If yes, extend it. Do not re-implement.

2. **Install if needed**:

   ```bash
   npm install @tanstack/react-table
   npx shadcn add table
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
   import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

   interface DataTableProps<T> {
     columns: ColumnDef<T>[]
     data: T[]
   }

   export function DataTable<T>({ columns, data }: DataTableProps<T>) {
     const table = useReactTable({
       data,
       columns,
       getCoreRowModel: getCoreRowModel(),
       getSortedRowModel: getSortedRowModel(),
       getPaginationRowModel: getPaginationRowModel(),
     })

     return (
       <Table>
         <TableHeader>
           {table.getHeaderGroups().map((hg) => (
             <TableRow key={hg.id}>
               {hg.headers.map((h) => (
                 <TableHead key={h.id}>
                   {flexRender(h.column.columnDef.header, h.getContext())}
                 </TableHead>
               ))}
             </TableRow>
           ))}
         </TableHeader>
         <TableBody>
           {table.getRowModel().rows.map((row) => (
             <TableRow key={row.id}>
               {row.getVisibleCells().map((cell) => (
                 <TableCell key={cell.id}>
                   {flexRender(cell.column.columnDef.cell, cell.getContext())}
                 </TableCell>
               ))}
             </TableRow>
           ))}
         </TableBody>
       </Table>
     )
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
