import { formatDistanceToNowStrict } from "date-fns";
import { Calendar, Clock3, Fingerprint, MapPin, Radio, ShieldCheck, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Progress, ProgressIndicator, ProgressTrack } from "@/components/ui/progress";
import { formatInTimeZone } from "@/lib/date";
import type { DashboardSummary } from "@/types/dashboard";

interface LiveStatusProps {
  summary: DashboardSummary;
  timeZone: string;
}

export function LiveStatus({ summary, timeZone }: LiveStatusProps) {
  const { liveMeeting, upcomingMeeting } = summary;

  if (liveMeeting) {
    return (
      <section className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.03] p-5 sm:p-6">
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <Radio className="size-3.5 animate-pulse" />
                <span className="text-xs font-semibold uppercase tracking-wider">Live</span>
              </div>
              <h2 className="text-lg font-semibold tracking-tight sm:text-xl">
                {liveMeeting.name}
              </h2>
            </div>
            <Badge variant="success" className="shrink-0">
              Check-in open
            </Badge>
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Clock3 className="size-3" />
              {formatInTimeZone(liveMeeting.startTime, "h:mm a", timeZone)} &ndash;{" "}
              {formatInTimeZone(liveMeeting.endTime, "h:mm a", timeZone)}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="size-3" />
              {liveMeeting.location ?? "No location"}
            </span>
            {liveMeeting.geofenceEnabled ? (
              <span className="flex items-center gap-1.5 text-info-foreground">
                <ShieldCheck className="size-3" />
                Geofence
              </span>
            ) : null}
            {liveMeeting.fingerprintEnabled ? (
              <span className="flex items-center gap-1.5 text-warning-foreground">
                <Fingerprint className="size-3" />
                Device lock
              </span>
            ) : null}
          </div>

          {/* Progress bar */}
          <Progress className="gap-2" value={liveMeeting.attendanceRate}>
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-medium text-foreground">Roster coverage</span>
              <span className="font-mono text-lg font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                {liveMeeting.attendanceRate}%
              </span>
            </div>
            <ProgressTrack className="h-2 rounded-full bg-emerald-500/10">
              <ProgressIndicator className="rounded-full bg-emerald-500" />
            </ProgressTrack>
          </Progress>

          {/* Counts */}
          <div className="flex gap-1.5">
            <Badge variant="outline" size="sm">
              {liveMeeting.recorded} checked in
            </Badge>
            <Badge variant="outline" size="sm">
              {liveMeeting.absent} absent
            </Badge>
            {liveMeeting.late > 0 ? (
              <Badge variant="warning" size="sm">
                {liveMeeting.late} late
              </Badge>
            ) : null}
          </div>
        </div>
      </section>
    );
  }

  if (upcomingMeeting) {
    return (
      <section className="rounded-xl border border-border/60 bg-card p-5 sm:p-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Sparkles className="size-3.5" />
            <span className="text-xs font-semibold uppercase tracking-wider">Up next</span>
          </div>
          <h2 className="text-lg font-semibold tracking-tight sm:text-xl">
            {upcomingMeeting.name}
          </h2>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="size-3" />
              {formatInTimeZone(upcomingMeeting.startTime, "EEE, MMM d", timeZone)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock3 className="size-3" />
              Starts{" "}
              {formatDistanceToNowStrict(upcomingMeeting.startTime, {
                addSuffix: true,
              })}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="size-3" />
              {upcomingMeeting.location ?? "No location"}
            </span>
          </div>
        </div>
      </section>
    );
  }

  return (
    <Empty className="rounded-xl border border-border/60 p-8 md:p-10">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Calendar />
        </EmptyMedia>
        <EmptyTitle>No meetings on deck</EmptyTitle>
        <EmptyDescription>Create one to see real-time check-in progress here.</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
