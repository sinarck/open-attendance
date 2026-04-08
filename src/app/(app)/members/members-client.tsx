"use client";

import { usePreloadedAuthQuery } from "@convex-dev/better-auth/nextjs/client";
import type { Preloaded } from "convex/react";
import { UsersRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import type { api } from "../../../../convex/_generated/api";
import { archivedMemberColumns, buildActiveMemberColumns } from "./member-columns";

interface MembersClientProps {
  preloadedRoster: Preloaded<typeof api.members.listRoster>;
  timeZone: string;
}

export function MembersClient({ preloadedRoster, timeZone }: MembersClientProps) {
  const roster = usePreloadedAuthQuery(preloadedRoster);

  if (roster == null) {
    return null;
  }

  const activeMemberColumns = buildActiveMemberColumns(timeZone);

  if (roster.active.length === 0 && roster.archived.length === 0) {
    return (
      <main className="space-y-6 p-4 sm:p-6">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <UsersRound />
            </EmptyMedia>
            <EmptyTitle>No members yet</EmptyTitle>
            <EmptyDescription>Add your first member to begin tracking attendance.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </main>
    );
  }

  return (
    <main className="space-y-6 p-4 sm:p-6">
      <section>
        <div className="mb-2 flex items-center gap-2">
          <h2 className="text-xs font-medium text-muted-foreground">Active</h2>
          <Badge size="sm" variant="outline">
            {roster.active.length}
          </Badge>
        </div>
        <DataTable
          columns={activeMemberColumns}
          data={roster.active}
          emptyTitle="No active members"
          emptyDescription="Archived members stay below. Add someone new to bring the active roster back."
        />
      </section>
      {roster.archived.length > 0 && (
        <section>
          <div className="mb-2 flex items-center gap-2">
            <h2 className="text-xs font-medium text-muted-foreground">Archived</h2>
            <Badge size="sm" variant="secondary">
              {roster.archived.length}
            </Badge>
          </div>
          <DataTable
            columns={archivedMemberColumns}
            data={roster.archived}
            emptyTitle="No archived members"
            emptyDescription="Archived members will appear here when you remove them from the active roster."
            rowClassName={() => "opacity-50"}
          />
        </section>
      )}
    </main>
  );
}
