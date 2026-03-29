"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import type { Doc } from "../../../../convex/_generated/dataModel";

type Meeting = Doc<"meetings">;
type Member = Doc<"members">;

export const meetingColumns: ColumnDef<Meeting>[] = [
  {
    accessorKey: "name",
    header: "Meeting",
    cell: ({ row }) => <span className="text-sm font-medium">{row.original.name}</span>,
  },
  {
    accessorKey: "location",
    header: "Location",
    cell: ({ row }) => <span className="ui-meta">{row.original.location || "—"}</span>,
  },
  {
    id: "features",
    header: "Features",
    cell: ({ row }) => {
      const hasGeofence = row.original.geofence != null;
      if (!hasGeofence && !row.original.requireFingerprint) {
        return <span className="text-xs text-muted-foreground">—</span>;
      }
      return (
        <div className="flex items-center gap-1.5">
          {hasGeofence && (
            <Badge size="sm" variant="outline">
              Geo
            </Badge>
          )}
          {row.original.requireFingerprint && (
            <Badge size="sm" variant="outline">
              FP
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => (
      <Badge size="sm" variant={row.original.isActive ? "default" : "secondary"}>
        {row.original.isActive ? "Live" : "Closed"}
      </Badge>
    ),
  },
];

export const memberColumns: ColumnDef<Member>[] = [
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
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => (
      <Badge size="sm" variant={row.original.isActive ? "outline" : "secondary"}>
        {row.original.isActive ? "Active" : "Archived"}
      </Badge>
    ),
  },
];
