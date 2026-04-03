"use client";

import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "./empty";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  emptyTitle: string;
  emptyDescription?: string;
  rowClassName?: (row: TData) => string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  emptyTitle,
  emptyDescription,
  rowClassName,
}: DataTableProps<TData, TValue>) {
  // Tracking: React Compiler and React Doctor flag TanStack Table as a known
  // incompatible library because the table instance mutates in place. We keep
  // the library and suppress `react-hooks-js/incompatible-library` in the
  // repo's React Doctor config until upstream guidance changes.
  // See: https://github.com/facebook/react/issues/33057
  // See: https://github.com/facebook/react/pull/34027
  // See: https://github.com/TanStack/table/issues/5567
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} className="px-4">
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length > 0 ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} className={cn(rowClassName?.(row.original))}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="px-4 py-2">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="p-0">
                <Empty className="rounded-none border-0 p-8 md:p-10">
                  <EmptyHeader>
                    <EmptyTitle>{emptyTitle}</EmptyTitle>
                    {emptyDescription && <EmptyDescription>{emptyDescription}</EmptyDescription>}
                  </EmptyHeader>
                </Empty>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
