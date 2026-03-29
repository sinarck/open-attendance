"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { formatInTimeZone } from "@/lib/date";
import type { Doc } from "../../../../convex/_generated/dataModel";

type Member = Doc<"members">;

export function buildActiveMemberColumns(timeZone: string): ColumnDef<Member>[] {
  return [
    {
      accessorKey: "name",
      header: "Member",
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
            {row.original.name
              .split(" ")
              .map((word) => word[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)}
          </div>
          <span className="text-sm font-medium">{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: "identifier",
      header: "Identifier",
      cell: ({ row }) => (
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
          {row.original.identifier}
        </code>
      ),
    },
    {
      accessorKey: "_creationTime",
      header: "Added",
      cell: ({ row }) => (
        <span className="ui-meta">
          {formatInTimeZone(row.original._creationTime, "MMM d", timeZone)}
        </span>
      ),
    },
  ];
}

export const archivedMemberColumns: ColumnDef<Member>[] = [
  {
    accessorKey: "name",
    header: "Member",
    cell: ({ row }) => <span className="text-sm font-medium">{row.original.name}</span>,
  },
  {
    accessorKey: "identifier",
    header: "Identifier",
    cell: ({ row }) => (
      <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
        {row.original.identifier}
      </code>
    ),
  },
];
