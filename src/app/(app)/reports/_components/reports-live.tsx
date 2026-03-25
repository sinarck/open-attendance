"use client";

import { usePreloadedAuthQuery } from "@convex-dev/better-auth/nextjs/client";
import type { Preloaded } from "convex/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { api } from "../../../../../convex/_generated/api";
import { meetingColumns, memberColumns } from "../columns";

interface ReportsLiveProps {
  preloadedOverview: Preloaded<typeof api.reports.overview>;
}

export function ReportsLive({ preloadedOverview }: ReportsLiveProps) {
  const overview = usePreloadedAuthQuery(preloadedOverview);

  if (overview === null) {
    return null;
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat
          label="Total Members"
          value={overview.summary.totalMembers}
          sub={`${overview.summary.activeMembers} active`}
        />
        <Stat
          label="Total Meetings"
          value={overview.summary.totalMeetings}
          sub={`${overview.summary.activeMeetings} active`}
        />
        <Stat
          label="Active Members"
          value={overview.summary.activeMembers}
          sub={`${overview.summary.archivedMembers} archived`}
        />
      </div>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">All Meetings</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={meetingColumns}
            data={overview.meetings}
            emptyTitle="No meetings yet"
            emptyDescription="Meetings need to exist before reports can show trends and breakdowns."
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Members Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={memberColumns}
            data={overview.members}
            emptyTitle="No members yet"
            emptyDescription="Add members to see roster and attendance reporting here."
            rowClassName={(row) => (!row.isActive ? "opacity-50" : "")}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: number; sub: string }) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <p className="text-[13px] text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-semibold">{value}</p>
        <p className="mt-1.5 text-xs text-muted-foreground">{sub}</p>
      </CardContent>
    </Card>
  );
}
