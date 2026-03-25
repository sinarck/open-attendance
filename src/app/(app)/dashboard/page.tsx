import { Activity, CalendarRange, Fingerprint, ShieldCheck, Users2, Waves } from "lucide-react";
import { requireAppContext } from "@/lib/app-context";
import { fetchAuthQuery } from "@/lib/auth-server";
import { cn } from "@/lib/utils";
import { api } from "../../../../convex/_generated/api";
import { AttentionList } from "./_components/attention-list";
import { LiveStatus } from "./_components/live-status";
import { RecentMeetings } from "./_components/recent-meetings";

export default async function DashboardPage() {
  await requireAppContext();
  const s = await fetchAuthQuery(api.dashboard.summary);

  const metrics = [
    {
      key: "roster",
      icon: Users2,
      label: "Active roster",
      value: s.activeMembers,
      sub: `${s.archivedMembers} archived`,
      accent: "from-chart-2/16 to-chart-2/4",
    },
    {
      key: "rate",
      icon: Activity,
      label: "Capture rate",
      value: `${s.recentAttendanceRate}%`,
      sub: `Last ${s.recentMeetings.length} meetings`,
      accent: "from-chart-4/16 to-chart-4/4",
    },
    {
      key: "meetings",
      icon: CalendarRange,
      label: "Meetings",
      value: s.totalMeetings,
      sub: `${s.activeMeetings} live, ${s.completedMeetings} closed`,
      accent: "from-chart-1/16 to-chart-1/4",
    },
    {
      key: "checkins",
      icon: Waves,
      label: "Check-ins",
      value: s.totalCheckIns,
      sub: "All-time recorded entries",
      accent: "from-chart-5/16 to-chart-5/4",
    },
  ] as const;

  const safeguards = [
    {
      key: "geo",
      icon: ShieldCheck,
      count: s.geoFenceMeetings,
      label: "geo-fenced",
    },
    {
      key: "fp",
      icon: Fingerprint,
      count: s.fingerprintMeetings,
      label: "device-verified",
    },
  ] as const;

  return (
    <main className="space-y-8 p-4 pb-12 sm:p-6 sm:pb-16">
      {/* ── KPI Strip ────────────────────────────────────── */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ key, icon: Icon, label, value, sub, accent }) => (
          <div
            key={key}
            className={cn(
              "relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br p-5",
              accent,
            )}
          >
            <div className="flex items-start justify-between">
              <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                {label}
              </span>
              <Icon className="size-4 text-muted-foreground/60" />
            </div>
            <p className="mt-3 font-mono text-3xl font-semibold tracking-tight">{value}</p>
            <p className="mt-1.5 text-[13px] text-muted-foreground">{sub}</p>
          </div>
        ))}
      </section>

      {/* ── Live / Upcoming ──────────────────────────────── */}
      <LiveStatus summary={s} />

      {/* ── Two-column: meetings + attention ──────────────── */}
      <section className="grid gap-6 xl:grid-cols-2">
        {/* Recent meetings */}
        <div className="space-y-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold tracking-tight">Recent meetings</h2>
            <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
              Last {s.recentMeetings.length}
            </span>
          </div>
          <RecentMeetings meetings={s.recentMeetings} />
        </div>

        {/* Attention list */}
        <div className="space-y-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold tracking-tight">Needs attention</h2>
            <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
              Lowest {s.membersNeedingAttention.length} rates
            </span>
          </div>
          <AttentionList summary={s} />
        </div>
      </section>

      {/* ── Safeguard strip ──────────────────────────────── */}
      <section className="rounded-2xl border border-border/60 p-5">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
          Safeguard coverage
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {safeguards.map(({ key, icon: Icon, count, label }) => (
            <div key={key} className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl border border-border/60 bg-muted/40">
                <Icon className="size-4 text-foreground" />
              </div>
              <div>
                <p className="font-mono text-lg font-semibold tabular-nums leading-tight">
                  {count}
                </p>
                <p className="text-[12px] text-muted-foreground">meetings {label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
