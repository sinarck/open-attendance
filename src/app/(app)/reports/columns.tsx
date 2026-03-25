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
    cell: ({ row }) => <span className="text-[13px] font-medium">{row.original.name}</span>,
  },
  {
    accessorKey: "location",
    header: "Location",
    cell: ({ row }) => (
      <span className="text-[13px] text-muted-foreground">{row.original.location || "—"}</span>
    ),
  },
  {
    id: "features",
    header: "Features",
    cell: ({ row }) => {
      const hasGeo = row.original.geoFenceLatitude != null;
      if (!hasGeo && !row.original.requireFingerprint) {
        return <span className="text-xs text-muted-foreground">—</span>;
      }
      return (
        <div className="flex items-center gap-1.5">
          {hasGeo && (
            <Badge variant="outline" className="text-[10px]">
              Geo
            </Badge>
          )}
          {row.original.requireFingerprint && (
            <Badge variant="outline" className="text-[10px]">
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
      <Badge variant={row.original.isActive ? "default" : "secondary"} className="text-[11px]">
        {row.original.isActive ? "Live" : "Closed"}
      </Badge>
    ),
  },
];

export const memberColumns: ColumnDef<Member>[] = [
  {
    accessorKey: "name",
    header: "Member",
    cell: ({ row }) => <span className="text-[13px] font-medium">{row.original.name}</span>,
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
      <Badge variant={row.original.isActive ? "outline" : "secondary"} className="text-[11px]">
        {row.original.isActive ? "Active" : "Archived"}
      </Badge>
    ),
  },
];
