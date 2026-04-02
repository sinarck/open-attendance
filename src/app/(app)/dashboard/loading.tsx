import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <main className="space-y-6 p-4 pb-12 sm:p-6 sm:pb-16">
      {/* KPI strip */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {["kpi-1", "kpi-2", "kpi-3", "kpi-4"].map((key) => (
          <div key={key} className="rounded-xl border border-border/60 bg-card p-4">
            <div className="flex items-center gap-2.5">
              <Skeleton className="size-8 rounded-lg" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="mt-3 h-7 w-14" />
            <Skeleton className="mt-1.5 h-3 w-24" />
          </div>
        ))}
      </section>

      {/* Live status */}
      <div className="rounded-xl border border-border/60 bg-card p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-6 w-44" />
          </div>
          <Skeleton className="h-5 w-20 rounded-sm" />
        </div>
        <div className="mt-4 flex gap-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="mt-5 h-2 w-full rounded-full" />
        <div className="mt-3 flex gap-1.5">
          <Skeleton className="h-4 w-20 rounded-sm" />
          <Skeleton className="h-4 w-16 rounded-sm" />
        </div>
      </div>

      {/* Two-column */}
      <section className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-3">
          <div className="flex items-baseline justify-between px-1">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-3 w-10" />
          </div>
          {["mtg-1", "mtg-2", "mtg-3"].map((key) => (
            <div key={key} className="rounded-xl border border-border/60 bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Skeleton className="h-3.5 w-32" />
                  <div className="mt-1.5 flex gap-3">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <Skeleton className="h-4.5 w-14 rounded-sm" />
              </div>
              <Skeleton className="mt-3 h-1 w-full rounded-full" />
              <div className="mt-2.5 flex gap-1">
                <Skeleton className="h-4 w-12 rounded-sm" />
                <Skeleton className="h-4 w-14 rounded-sm" />
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-3">
          <div className="flex items-baseline justify-between px-1">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-3 w-14" />
          </div>
          {["mem-1", "mem-2", "mem-3"].map((key) => (
            <div key={key} className="rounded-xl border border-border/60 bg-card p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="size-8 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="mt-1 h-3 w-16" />
                </div>
                <Skeleton className="h-4.5 w-10 rounded-sm" />
              </div>
              <Skeleton className="mt-3 h-1 w-full rounded-full" />
              <div className="mt-2.5 flex gap-3">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-14" />
                <Skeleton className="h-3 w-14" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Safeguard strip */}
      <section className="grid gap-3 sm:grid-cols-2">
        {["sg-1", "sg-2"].map((key) => (
          <div
            key={key}
            className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-4"
          >
            <Skeleton className="size-8 rounded-lg" />
            <div>
              <Skeleton className="h-5 w-8" />
              <Skeleton className="mt-1 h-3 w-24" />
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
