"use client";

import { useQuery } from "convex/react";

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "../../../../convex/_generated/api";
import type { Doc } from "../../../../convex/_generated/dataModel";
import { activeColumns, archivedColumns } from "./columns";

type Member = Doc<"members">;
const EMPTY_MEMBERS: Member[] = [];

export default function MembersPage() {
  const active = useQuery(api.members.list);
  const all = useQuery(api.members.listAll);
  const activeData = active ?? EMPTY_MEMBERS;
  const archived = useMemo(
    () => (all ? all.filter((m) => !m.isActive) : EMPTY_MEMBERS),
    [all],
  );
  if (active === undefined || all === undefined)
    return (
      <div className="space-y-6 p-4 sm:p-6">
        <section>
          <div className="mb-2 flex items-center gap-2">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-5 w-8 rounded-full" />
          </div>
          <div className="rounded-lg border px-4 py-2">
            <div className="grid grid-cols-[1fr_160px_100px] border-b py-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-12" />
            </div>
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="grid grid-cols-[1fr_160px_100px] items-center border-b py-2 last:border-0"
              >
                <div className="flex items-center gap-2.5">
                  <Skeleton className="size-7 rounded-full" />
                  <Skeleton className="h-4 w-28" />
                </div>
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </div>
        </section>
        <section>
          <div className="mb-2 flex items-center gap-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-5 w-8 rounded-full" />
          </div>
          <div className="rounded-lg border px-4 py-2">
            <div className="grid grid-cols-[1fr_160px] border-b py-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
            </div>
            {[0, 1].map((i) => (
              <div
                key={i}
                className="grid grid-cols-[1fr_160px] items-center border-b py-2 last:border-0 opacity-50"
              >
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-5 w-20" />
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  return (
    <div className="space-y-6 p-4 sm:p-6">
      <section>
        <div className="mb-2 flex items-center gap-2">
          <h2 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Active
          </h2>
          <Badge variant="outline" className="text-[11px]">
            {active.length}
          </Badge>
        </div>
        <div className="rounded-lg border">
          {active.length === 0 ? (
            <Empty className="rounded-none border-0 p-8 md:p-10">
              <EmptyHeader>
                <EmptyTitle>No members yet</EmptyTitle>
                <EmptyDescription>
                  Add your first member to begin tracking attendance.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <DataTable
              columns={activeColumns}
              data={activeData}
              emptyTitle="No members yet"
              emptyDescription="Add your first member to begin tracking attendance."
            />
          )}
        </div>
      </section>
      {archived.length > 0 && (
        <section>
          <div className="mb-2 flex items-center gap-2">
            <h2 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Archived
            </h2>
            <Badge variant="secondary" className="text-[11px]">
              {archived.length}
            </Badge>
          </div>
          <div className="rounded-lg border">
            <DataTable
              columns={archivedColumns}
              data={archived}
              emptyTitle="No archived members"
              emptyDescription="Archived members will appear here when you remove them from the active roster."
              rowClassName={() => "opacity-50"}
            />
          </div>
        </section>
      )}
    </div>
  );
}
