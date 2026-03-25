"use client";

import { usePreloadedAuthQuery } from "@convex-dev/better-auth/nextjs/client";
import type { Preloaded } from "convex/react";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { api } from "../../../../../convex/_generated/api";
import { columns } from "../columns";

interface MeetingsLiveProps {
  preloadedMeetings: Preloaded<typeof api.meetings.list>;
}

export function MeetingsLive({ preloadedMeetings }: MeetingsLiveProps) {
  const meetings = usePreloadedAuthQuery(preloadedMeetings);

  if (meetings === null) {
    return null;
  }

  const active = meetings.filter((meeting) => meeting.isActive);
  const closed = meetings.filter((meeting) => !meeting.isActive);

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
