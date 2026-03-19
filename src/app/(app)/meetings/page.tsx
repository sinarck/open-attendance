"use client";

import { useQuery } from "convex/react";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "../../../../convex/_generated/api";
import type { Doc } from "../../../../convex/_generated/dataModel";
import { columns } from "./columns";

const EMPTY_MEETINGS: Doc<"meetings">[] = [];

export default function MeetingsPage() {
  const meetings = useQuery(api.meetings.list);
  const active = useMemo(
    () => (meetings ? meetings.filter((m) => m.isActive) : EMPTY_MEETINGS),
    [meetings],
  );
  const closed = useMemo(
    () => (meetings ? meetings.filter((m) => !m.isActive) : EMPTY_MEETINGS),
    [meetings],
  );
  if (meetings === undefined)
    return (
      <div className="space-y-6 p-4 sm:p-6">
        <section>
          <div className="mb-2 flex items-center gap-2">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-5 w-8 rounded-full" />
          </div>
          <div className="rounded-lg border px-4 py-2">
            <div className="grid grid-cols-[1fr_120px_160px] border-b py-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-14" />
            </div>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="grid grid-cols-[1fr_120px_160px] items-center border-b py-2 last:border-0"
              >
                <div className="space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-28" />
                </div>
                <Skeleton className="h-5 w-16" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-14 rounded-full" />
                  <Skeleton className="size-3 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </section>
        <section>
          <div className="mb-2 flex items-center gap-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-5 w-8 rounded-full" />
          </div>
          <div className="rounded-lg border px-4 py-2">
            <div className="grid grid-cols-[1fr_120px_160px] border-b py-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-14" />
            </div>
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="grid grid-cols-[1fr_120px_160px] items-center border-b py-2 last:border-0"
              >
                <div className="space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-28" />
                </div>
                <Skeleton className="h-5 w-16" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-14 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  return (
    <div className="space-y-6 p-4 sm:p-6">
      {active.length > 0 && (
        <section>
          <div className="mb-2 flex items-center gap-2">
            <h2 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Active
            </h2>
            <Badge variant="outline" className="text-[11px]">
              {active.length}
            </Badge>
          </div>
          <DataTable
            columns={columns}
            data={active}
            emptyTitle="No active meetings"
            emptyDescription="Active meetings will show up here as soon as one is live."
          />
        </section>
      )}
      <section>
        <div className="mb-2 flex items-center gap-2">
          <h2 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Completed
          </h2>
          <Badge variant="secondary" className="text-[11px]">
            {closed.length}
          </Badge>
        </div>
        <DataTable
          columns={columns}
          data={closed}
          emptyTitle="No completed meetings"
          emptyDescription="Closed meetings will appear here once attendance has been taken."
        />
      </section>
    </div>
  );
}
