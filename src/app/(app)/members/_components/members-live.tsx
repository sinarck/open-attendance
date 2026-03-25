"use client";

import { usePreloadedAuthQuery } from "@convex-dev/better-auth/nextjs/client";
import type { Preloaded } from "convex/react";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { api } from "../../../../../convex/_generated/api";
import { activeColumns, archivedColumns } from "../columns";

interface MembersLiveProps {
  preloadedRoster: Preloaded<typeof api.members.listRoster>;
}

export function MembersLive({ preloadedRoster }: MembersLiveProps) {
  const roster = usePreloadedAuthQuery(preloadedRoster);

  if (roster === null) {
    return null;
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <section>
        <div className="mb-2 flex items-center gap-2">
          <h2 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Active
          </h2>
          <Badge variant="outline" className="text-[11px]">
            {roster.active.length}
          </Badge>
        </div>
        <div className="rounded-lg border">
          {roster.active.length === 0 ? (
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
              data={roster.active}
              emptyTitle="No members yet"
              emptyDescription="Add your first member to begin tracking attendance."
            />
          )}
        </div>
      </section>
      {roster.archived.length > 0 && (
        <section>
          <div className="mb-2 flex items-center gap-2">
            <h2 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Archived
            </h2>
            <Badge variant="secondary" className="text-[11px]">
              {roster.archived.length}
            </Badge>
          </div>
          <div className="rounded-lg border">
            <DataTable
              columns={archivedColumns}
              data={roster.archived}
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
