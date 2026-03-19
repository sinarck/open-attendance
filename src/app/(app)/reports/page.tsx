"use client";

import { useQuery } from "convex/react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "../../../../convex/_generated/api";
import type { Doc } from "../../../../convex/_generated/dataModel";
import { meetingColumns, memberColumns } from "./columns";

const EMPTY_MEETINGS: Doc<"meetings">[] = [];
const EMPTY_MEMBERS: Doc<"members">[] = [];

export default function ReportsPage() {
  const meetings = useQuery(api.meetings.list);
  const members = useQuery(api.members.list);
  const allMembers = useQuery(api.members.listAll);
  const meetingsData = meetings ?? EMPTY_MEETINGS;
  const membersData = allMembers ?? EMPTY_MEMBERS;
  if (
    meetings === undefined ||
    members === undefined ||
    allMembers === undefined
  )
    return (
      <div className="space-y-6 p-4 sm:p-6">
        <div className="grid gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Card key={i}>
              <CardContent className="pt-5 pb-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="mt-2 h-7 w-12" />
                <Skeleton className="mt-1.5 h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader className="pb-3">
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-[1fr_140px_140px_120px] border-b py-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-12" />
            </div>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="grid grid-cols-[1fr_140px_140px_120px] items-center border-b py-2 last:border-0"
              >
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-20" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-10 rounded-full" />
                  <Skeleton className="h-5 w-8 rounded-full" />
                </div>
                <Skeleton className="h-6 w-14 rounded-full" />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-[1fr_160px_120px] border-b py-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-12" />
            </div>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="grid grid-cols-[1fr_160px_120px] items-center border-b py-2 last:border-0"
              >
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-6 w-14 rounded-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  const activeMeetingCount = meetings.filter((m) => m.isActive).length;
  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat
          label="Total Members"
          value={allMembers.length}
          sub={`${members.length} active`}
        />
        <Stat
          label="Total Meetings"
          value={meetings.length}
          sub={`${activeMeetingCount} active`}
        />
        <Stat
          label="Active Members"
          value={members.length}
          sub={`${allMembers.length - members.length} archived`}
        />
      </div>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">All Meetings</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={meetingColumns}
            data={meetingsData}
            emptyTitle="No meetings yet"
            emptyDescription="Meetings need to exist before reports can show trends and breakdowns."
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">
            Members Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={memberColumns}
            data={membersData}
            emptyTitle="No members yet"
            emptyDescription="Add members to see roster and attendance reporting here."
            rowClassName={(row) => (!row.isActive ? "opacity-50" : "")}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: number;
  sub: string;
}) {
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
