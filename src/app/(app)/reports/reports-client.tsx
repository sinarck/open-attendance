"use client";

import { usePreloadedAuthQuery } from "@convex-dev/better-auth/nextjs/client";
import type { Preloaded } from "convex/react";
import { ChartColumnBig } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import type { api } from "../../../../convex/_generated/api";
import { ReportStatCard } from "./report-stat-card";
import { meetingColumns, memberColumns } from "./report-columns";

interface ReportsClientProps {
  preloadedOverview: Preloaded<typeof api.reports.overview>;
}

export function ReportsClient({ preloadedOverview }: ReportsClientProps) {
  const overview = usePreloadedAuthQuery(preloadedOverview);

  if (overview == null) {
    return null;
  }

  if (overview.meetings.length === 0 && overview.members.length === 0) {
    return (
      <main className="space-y-6 p-4 sm:p-6">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ChartColumnBig />
            </EmptyMedia>
            <EmptyTitle>No reports yet</EmptyTitle>
            <EmptyDescription>
              Reports will fill in once you have members and meetings to summarize.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </main>
    );
  }

  return (
    <main className="space-y-6 p-4 sm:p-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <ReportStatCard
          label="Total Members"
          value={overview.summary.totalMembers}
          meta={`${overview.summary.activeMembers} active`}
        />
        <ReportStatCard
          label="Total Meetings"
          value={overview.summary.totalMeetings}
          meta={`${overview.summary.activeMeetings} active`}
        />
        <ReportStatCard
          label="Active Members"
          value={overview.summary.activeMembers}
          meta={`${overview.summary.archivedMembers} archived`}
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
    </main>
  );
}
