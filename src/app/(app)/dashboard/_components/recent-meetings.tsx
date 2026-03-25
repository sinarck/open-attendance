import { format } from "date-fns";
import { Clock3, Fingerprint, MapPin, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress, ProgressIndicator, ProgressTrack } from "@/components/ui/progress";
import type { DashboardSummary } from "../../../../../convex/dashboard";

type Meeting = DashboardSummary["recentMeetings"][number];

const STAGE_VARIANT = {
  live: "success",
  upcoming: "info",
  closed: "secondary",
} as const;

interface RecentMeetingsProps {
  meetings: Meeting[];
}

export function RecentMeetings({ meetings }: RecentMeetingsProps) {
  if (meetings.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-dashed border-border/60 p-8">
        <p className="max-w-xs text-center text-sm text-muted-foreground">
          Schedule your first meeting to see attendance health here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {meetings.map((meeting) => (
        <div
          key={meeting._id}
          className="group rounded-xl border border-border/60 p-4 transition-colors hover:border-border"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{meeting.name}</p>
              <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock3 className="size-3" />
                  {format(meeting.startTime, "MMM d, h:mm a")}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="size-3" />
                  {meeting.location ?? "No location"}
                </span>
              </div>
            </div>
            <Badge variant={STAGE_VARIANT[meeting.stage]} className="shrink-0">
              {meeting.stage}
            </Badge>
          </div>

          {/* Progress */}
          <Progress className="mt-4 gap-1.5" value={meeting.attendanceRate}>
            <div className="flex items-baseline justify-between">
              <span className="text-[12px] text-muted-foreground">Coverage</span>
              <span className="font-mono text-sm font-semibold tabular-nums">
                {meeting.attendanceRate}%
              </span>
            </div>
            <ProgressTrack className="h-1.5 rounded-full">
              <ProgressIndicator className="rounded-full bg-chart-2" />
            </ProgressTrack>
          </Progress>

          {/* Badges */}
          <div className="mt-3 flex flex-wrap gap-1.5">
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
            {meeting.geoFenceEnabled ? (
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
