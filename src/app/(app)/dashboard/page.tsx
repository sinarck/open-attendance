import { getTime, startOfMinute } from "date-fns";
import { Activity, CalendarRange, Fingerprint, ShieldCheck, Users2, Waves } from "lucide-react";
import { requireOrganization } from "@/lib/auth/guards";
import { fetchAuthQuery } from "@/lib/auth/server";
import { api } from "../../../../convex/_generated/api";
import { AttentionList } from "./_components/attention-list";
import { LiveStatus } from "./_components/live-status";
import { RecentMeetings } from "./_components/recent-meetings";

export default async function DashboardPage() {
  const organization = await requireOrganization();
  const { timezone } = organization;
  const currentMinute = getTime(startOfMinute(new Date()));
  const summary = await fetchAuthQuery(api.dashboard.summary, {
    now: currentMinute,
  });
  const {
    activeMeetings,
    activeMembers,
    archivedMembers,
    completedMeetings,
    fingerprintMeetings,
    geofenceMeetings,
    membersNeedingAttention,
    recentAttendanceRate,
    recentMeetings,
    totalCheckIns,
    totalMeetings,
  } = summary;

  const metrics = [
    {
      key: "roster",
      icon: Users2,
      label: "Active roster",
      value: activeMembers,
      meta: `${archivedMembers} archived`,
    },
    {
      key: "rate",
      icon: Activity,
      label: "Capture rate",
      value: `${recentAttendanceRate}%`,
      meta: `Last ${recentMeetings.length} meetings`,
    },
    {
      key: "meetings",
      icon: CalendarRange,
      label: "Meetings",
      value: totalMeetings,
      meta: `${activeMeetings} live, ${completedMeetings} closed`,
    },
    {
      key: "checkins",
      icon: Waves,
      label: "Check-ins",
      value: totalCheckIns,
      meta: "All-time recorded",
    },
  ] as const;

  return (
    <main className="space-y-6 p-4 pb-12 sm:p-6 sm:pb-16">
      {/* ── KPI Strip ────────────────────────────────────── */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ key, icon: Icon, label, value, meta }) => (
          <div key={key} className="rounded-xl border border-border/60 bg-card p-4">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-muted/60">
                <Icon className="size-3.5 text-muted-foreground" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">{label}</span>
            </div>
            <p className="mt-3 font-mono text-2xl font-semibold tracking-tight">{value}</p>
            <p className="ui-meta-compact mt-1">{meta}</p>
          </div>
        ))}
      </section>

      {/* ── Live / Upcoming ──────────────────────────────── */}
      <LiveStatus summary={summary} timeZone={timezone} />

      {/* ── Two-column: meetings + attention ──────────────── */}
      <section className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-3">
          <div className="flex items-baseline justify-between px-1">
            <h2 className="text-sm font-semibold tracking-tight">Recent meetings</h2>
            <span className="text-xs text-muted-foreground">Last {recentMeetings.length}</span>
          </div>
          <RecentMeetings meetings={recentMeetings} timeZone={timezone} />
        </div>

        <div className="space-y-3">
          <div className="flex items-baseline justify-between px-1">
            <h2 className="text-sm font-semibold tracking-tight">Needs attention</h2>
            <span className="text-xs text-muted-foreground">
              Lowest {membersNeedingAttention.length} rates
            </span>
          </div>
          <AttentionList summary={summary} />
        </div>
      </section>

      {/* ── Safeguard strip ──────────────────────────────── */}
      {(geofenceMeetings > 0 || fingerprintMeetings > 0) && (
        <section className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-4">
            <div className="flex size-8 items-center justify-center rounded-lg bg-muted/60">
              <ShieldCheck className="size-3.5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-mono text-lg font-semibold tabular-nums leading-tight">
                {geofenceMeetings}
              </p>
              <p className="ui-meta-compact">meetings geofenced</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-4">
            <div className="flex size-8 items-center justify-center rounded-lg bg-muted/60">
              <Fingerprint className="size-3.5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-mono text-lg font-semibold tabular-nums leading-tight">
                {fingerprintMeetings}
              </p>
              <p className="ui-meta-compact">device-verified</p>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
