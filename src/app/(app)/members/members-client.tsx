"use client";

import type { PropsWithChildren } from "react";
import { useState } from "react";
import { useConvexAuth, useQuery } from "convex/react";
import { UsersRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { api } from "../../../../convex/_generated/api";
import { MembersSectionsLoading } from "./loading";
import { AddMemberDialog } from "./_components/add-member-dialog";
import { ImportMembersSheet } from "./_components/import-members-sheet";
import { archivedMemberColumns, buildActiveMemberColumns } from "./member-columns";

interface MembersRosterContentProps {
  timeZone: string;
}

export function MembersPageShell({ children }: PropsWithChildren) {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [importSheetOpen, setImportSheetOpen] = useState(false);

  return (
    <>
      <main className="space-y-6 p-4 sm:p-6">
        <section className="flex flex-col gap-3 rounded-xl border border-border/70 bg-muted/20 p-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-base font-semibold text-foreground">Members</h1>
            <p className="text-sm text-muted-foreground">Manage your roster.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setImportSheetOpen(true)} type="button" variant="outline">
              Import CSV
            </Button>
            <Button onClick={() => setAddDialogOpen(true)} type="button">
              Add member
            </Button>
          </div>
        </section>
        {children}
      </main>
      <AddMemberDialog onOpenChange={setAddDialogOpen} open={addDialogOpen} />
      <ImportMembersSheet onOpenChange={setImportSheetOpen} open={importSheetOpen} />
    </>
  );
}

export function MembersRosterContent({ timeZone }: MembersRosterContentProps) {
  const { isAuthenticated } = useConvexAuth();
  const roster = useQuery(api.members.listRoster, isAuthenticated ? {} : "skip");

  if (roster === undefined) {
    return <MembersSectionsLoading />;
  }

  const activeMemberColumns = buildActiveMemberColumns(timeZone);

  if (roster.active.length === 0 && roster.archived.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <UsersRound />
          </EmptyMedia>
          <EmptyTitle>No members yet</EmptyTitle>
          <EmptyDescription>Add your first member to begin tracking attendance.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <p className="text-sm text-muted-foreground">
            Use Add member or Import CSV to get started.
          </p>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <>
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
    </>
  );
}
