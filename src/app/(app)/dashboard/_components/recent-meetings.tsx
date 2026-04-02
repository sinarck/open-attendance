import { Clock3, Fingerprint, MapPin, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Progress, ProgressIndicator, ProgressTrack } from "@/components/ui/progress";
import { recentMeetingStageVariants } from "@/config/dashboard";
import { formatInTimeZone } from "@/lib/date";
import type { DashboardSummary } from "../../../../../convex/dashboard";

type Meeting = DashboardSummary["recentMeetings"][number];

interface RecentMeetingsProps {
  meetings: Meeting[];
  timeZone: string;
}

export function RecentMeetings({ meetings, timeZone }: RecentMeetingsProps) {
  if (meetings.length === 0) {
    return (
      <Empty className="rounded-xl border border-border/60 p-8 md:p-10">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Clock3 />
          </EmptyMedia>
          <EmptyTitle>No meetings yet</EmptyTitle>
          <EmptyDescription>
            Schedule your first meeting to see attendance health here.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="space-y-2">
      {meetings.map((meeting) => (
        <div
          key={meeting._id}
          className="rounded-xl border border-border/60 bg-card p-4 transition-colors hover:border-border"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{meeting.name}</p>
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock3 className="size-3" />
                  {formatInTimeZone(meeting.startTime, "MMM d, h:mm a", timeZone)}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="size-3" />
                  {meeting.location ?? "No location"}
                </span>
              </div>
            </div>
            <Badge variant={recentMeetingStageVariants[meeting.stage]} className="shrink-0">
              {meeting.stage}
            </Badge>
          </div>

          {/* Progress */}
          <Progress className="mt-3 gap-1" value={meeting.attendanceRate}>
            <div className="flex items-baseline justify-between">
              <span className="text-[11px] text-muted-foreground">Coverage</span>
              <span className="font-mono text-xs font-semibold tabular-nums">
                {meeting.attendanceRate}%
              </span>
            </div>
            <ProgressTrack className="h-1 rounded-full">
              <ProgressIndicator className="rounded-full bg-chart-2" />
            </ProgressTrack>
          </Progress>

          {/* Badges */}
          <div className="mt-2.5 flex flex-wrap gap-1">
            <Badge variant="outline" size="sm">
              {meeting.recorded} in
            </Badge>
            <Badge variant="outline" size="sm">
              {meeting.absent} absent
            </Badge>
            {meeting.late > 0 ? (
              <Badge variant="warning" size="sm">
                {meeting.late} late
              </Badge>
            ) : null}
            {meeting.excused > 0 ? (
              <Badge variant="secondary" size="sm">
                {meeting.excused} excused
              </Badge>
            ) : null}
            {meeting.geofenceEnabled ? (
              <Badge variant="info" size="sm">
                <ShieldCheck className="size-3" />
                Geo
              </Badge>
            ) : null}
            {meeting.fingerprintEnabled ? (
              <Badge variant="warning" size="sm">
                <Fingerprint className="size-3" />
                FP
              </Badge>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
