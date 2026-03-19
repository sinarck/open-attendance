"use client";

import { useQuery } from "convex/react";
import { MapPin } from "lucide-react";
import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "../../../../convex/_generated/api";
import type { Doc } from "../../../../convex/_generated/dataModel";
import { columns } from "./columns";

const EMPTY_MEETINGS: Doc<"meetings">[] = [];

export default function DashboardPage() {
  const meetings = useQuery(api.meetings.list);
  const members = useQuery(api.members.list);
  const allMembers = useQuery(api.members.listAll);
  const recentMeetings = useMemo(
    () => (meetings ? meetings.slice(0, 5) : EMPTY_MEETINGS),
    [meetings],
  );

  if (
    meetings === undefined ||
    members === undefined ||
    allMembers === undefined
  ) {
    return (
      <div className="space-y-6 p-4 sm:p-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="pt-5 pb-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="mt-2 h-7 w-12" />
                <Skeleton className="mt-1.5 h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardContent className="flex items-center gap-4 py-4">
            <Skeleton className="size-2 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-28" />
            </div>
          </CardContent>
        </Card>
        <div className="rounded-lg border">
          <div className="px-4 py-3">
            <Skeleton className="h-4 w-28" />
          </div>
          <div className="px-4 py-2">
            <div className="grid grid-cols-[1fr_120px] border-t py-2 text-left">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-12" />
            </div>
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="grid grid-cols-[1fr_120px] items-center border-t py-2"
              >
                <div className="space-y-2">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-14 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const active = meetings.filter((m) => m.isActive);
  const liveMeeting = active[0];

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Members"
          value={members.length}
          sub={
            allMembers.length > members.length
              ? `${allMembers.length} total`
              : undefined
          }
        />
        <Stat
          label="Meetings"
          value={meetings.length}
          sub={`${active.length} active`}
        />
        <Stat label="Active" value={active.length} />
        <Stat
          label="Roster"
          value={allMembers.length}
          sub={`${allMembers.length - members.length} archived`}
        />
      </div>
      {liveMeeting && (
        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardContent className="flex items-center gap-4 py-4">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium">{liveMeeting.name}</p>
              {liveMeeting.location && (
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="size-3" />
                  {liveMeeting.location}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      <div className="rounded-lg border">
        <div className="px-4 py-3">
          <h2 className="text-[13px] font-medium">Recent Meetings</h2>
        </div>
        <DataTable
          columns={columns}
          data={recentMeetings}
          emptyTitle="No meetings yet"
          emptyDescription="Create your first meeting to start recording attendance."
        />
      </div>
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
  sub?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <p className="text-[13px] text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-semibold">{value}</p>
        {sub && <p className="mt-1.5 text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}
