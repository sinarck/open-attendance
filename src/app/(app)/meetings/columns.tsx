"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Fingerprint, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Doc } from "../../../../convex/_generated/dataModel";

type Meeting = Doc<"meetings">;

export const columns: ColumnDef<Meeting>[] = [
  {
    accessorKey: "name",
    header: "Meeting",
    cell: ({ row }) => (
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            "size-1.5 shrink-0 rounded-full",
            row.original.isActive ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/30",
          )}
        />
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium">{row.original.name}</p>
          {row.original.location && (
            <p className="flex items-center gap-0.5 text-xs text-muted-foreground">
              <MapPin className="size-3" />
              {row.original.location}
            </p>
          )}
        </div>
      </div>
    ),
  },
  {
    accessorKey: "checkInCode",
    header: "Code",
    cell: ({ row }) => (
      <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
        {row.original.checkInCode.slice(0, 8)}
      </code>
    ),
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5">
        <Badge variant={row.original.isActive ? "default" : "secondary"} className="text-[11px]">
          {row.original.isActive ? "Live" : "Closed"}
        </Badge>
        {row.original.geoFenceLatitude != null && (
          <MapPin className="size-3 text-muted-foreground/50" />
        )}
        {row.original.requireFingerprint && (
          <Fingerprint className="size-3 text-muted-foreground/50" />
        )}
      </div>
    ),
  },
];
