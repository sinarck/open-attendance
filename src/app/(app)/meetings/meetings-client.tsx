"use client";

import { useConvexAuth, useQuery } from "convex/react";
import { CalendarX2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { api } from "../../../../convex/_generated/api";
import { MeetingsSectionsLoading } from "./loading";
import { meetingColumns } from "./meeting-columns";

export function MeetingsContent() {
  const { isAuthenticated } = useConvexAuth();
  const meetings = useQuery(api.meetings.list, isAuthenticated ? {} : "skip");

  if (meetings === undefined) {
    return <MeetingsSectionsLoading />;
  }

  const activeMeetings = meetings.filter((meeting) => meeting.isActive);
  const closedMeetings = meetings.filter((meeting) => !meeting.isActive);

  if (meetings.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <CalendarX2 />
          </EmptyMedia>
          <EmptyTitle>No meetings yet</EmptyTitle>
          <EmptyDescription>
            Create your first meeting to start taking attendance and building a history here.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <>
      {activeMeetings.length > 0 && (
        <section>
          <div className="mb-2 flex items-center gap-2">
            <h2 className="text-xs font-medium text-muted-foreground">Active</h2>
            <Badge size="sm" variant="outline">
              {activeMeetings.length}
            </Badge>
          </div>
          <DataTable
            columns={meetingColumns}
            data={activeMeetings}
            emptyTitle="No active meetings"
            emptyDescription="Active meetings will show up here as soon as one is live."
          />
        </section>
      )}
      <section>
        <div className="mb-2 flex items-center gap-2">
          <h2 className="text-xs font-medium text-muted-foreground">Completed</h2>
          <Badge size="sm" variant="secondary">
            {closedMeetings.length}
          </Badge>
        </div>
        <DataTable
          columns={meetingColumns}
          data={closedMeetings}
          emptyTitle="No completed meetings"
          emptyDescription="Closed meetings will appear here once attendance has been taken."
        />
      </section>
    </>
  );
}
