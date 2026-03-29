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
import type { DashboardSummary } from "../../../../../convex/dashboard";

interface LiveStatusProps {
  summary: DashboardSummary;
  timeZone: string;
}

export function LiveStatus({ summary, timeZone }: LiveStatusProps) {
  const { liveMeeting, upcomingMeeting } = summary;

  if (liveMeeting) {
    return (
      <section className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.06] via-transparent to-transparent p-6 sm:p-7">
        {/* Decorative corner glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 -right-20 size-56 rounded-full bg-emerald-500/8 blur-3xl"
        />
        <div className="relative space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400">
                <Radio className="size-4 animate-pulse" />
                <span className="ui-eyebrow">Live session</span>
              </div>
              <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
                {liveMeeting.name}
              </h2>
            </div>
            <Badge variant="success" className="shrink-0">
              Check-in open
            </Badge>
          </div>

          {/* Meta row */}
          <div className="ui-meta flex flex-wrap gap-x-5 gap-y-2">
            <span className="flex items-center gap-1.5">
              <Clock3 className="size-3.5" />
              {formatInTimeZone(liveMeeting.startTime, "h:mm a", timeZone)} &ndash;{" "}
              {formatInTimeZone(liveMeeting.endTime, "h:mm a", timeZone)}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="size-3.5" />
              {liveMeeting.location ?? "No location"}
            </span>
            {liveMeeting.geofenceEnabled ? (
              <span className="flex items-center gap-1.5 text-info-foreground">
                <ShieldCheck className="size-3.5" />
                Geofence
              </span>
            ) : null}
            {liveMeeting.fingerprintEnabled ? (
              <span className="flex items-center gap-1.5 text-warning-foreground">
                <Fingerprint className="size-3.5" />
                Device&nbsp;lock
              </span>
            ) : null}
          </div>

          {/* Progress bar */}
          <Progress className="gap-2.5" value={liveMeeting.attendanceRate}>
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-medium text-foreground">Roster coverage</span>
              <span className="font-mono text-xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                {liveMeeting.attendanceRate}%
              </span>
            </div>
            <ProgressTrack className="h-2.5 rounded-full bg-emerald-500/10">
              <ProgressIndicator className="rounded-full bg-emerald-500" />
            </ProgressTrack>
          </Progress>

          {/* Counts */}
          <div className="flex gap-2">
            <Badge variant="outline">{liveMeeting.recorded} checked&nbsp;in</Badge>
            <Badge variant="outline">{liveMeeting.absent} absent</Badge>
            {liveMeeting.late > 0 ? <Badge variant="warning">{liveMeeting.late} late</Badge> : null}
          </div>
        </div>
      </section>
    );
  }

  if (upcomingMeeting) {
    return (
      <section className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-chart-2/8 via-transparent to-transparent p-6 sm:p-7">
        <div className="space-y-4">
          <div className="ui-eyebrow flex items-center gap-2 text-muted-foreground">
            <Sparkles className="size-3.5" />
            Up next
          </div>
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
            {upcomingMeeting.name}
          </h2>
          <div className="ui-meta flex flex-wrap gap-x-5 gap-y-2">
            <span className="flex items-center gap-1.5">
              <Calendar className="size-3.5" />
              {formatInTimeZone(upcomingMeeting.startTime, "EEE, MMM d", timeZone)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock3 className="size-3.5" />
              Starts{" "}
              {formatDistanceToNowStrict(upcomingMeeting.startTime, {
                addSuffix: true,
              })}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="size-3.5" />
              {upcomingMeeting.location ?? "No location"}
            </span>
          </div>
        </div>
      </section>
    );
  }

  return (
    <Empty className="rounded-2xl border border-border/60 p-8 md:p-10">
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
