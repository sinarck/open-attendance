import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <main className="space-y-8 p-4 pb-12 sm:p-6 sm:pb-16">
      {/* KPI strip */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {["kpi-1", "kpi-2", "kpi-3", "kpi-4"].map((key) => (
          <div key={key} className="rounded-2xl border border-border/60 p-5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-4 h-8 w-16" />
            <Skeleton className="mt-2 h-3.5 w-28" />
          </div>
        ))}
      </section>

      {/* Live status */}
      <div className="rounded-2xl border border-border/60 p-6 sm:p-7">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="mt-4 h-7 w-48" />
        <Skeleton className="mt-4 h-3 w-64" />
        <Skeleton className="mt-5 h-2.5 w-full rounded-full" />
      </div>

      {/* Two-column */}
      <section className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-4">
          <div className="flex items-baseline justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-12" />
          </div>
          {["mtg-1", "mtg-2", "mtg-3"].map((key) => (
            <div key={key} className="rounded-xl border border-border/60 p-4">
              <Skeleton className="h-3.5 w-36" />
              <Skeleton className="mt-2 h-3 w-48" />
              <Skeleton className="mt-4 h-1.5 w-full rounded-full" />
            </div>
          ))}
        </div>
        <div className="space-y-4">
          <div className="flex items-baseline justify-between">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-16" />
          </div>
          {["mem-1", "mem-2", "mem-3"].map((key) => (
            <div key={key} className="rounded-xl border border-border/60 p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="size-8 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="mt-1.5 h-3 w-16" />
                </div>
                <Skeleton className="h-5 w-10 rounded-sm" />
              </div>
              <Skeleton className="mt-3.5 h-1.5 w-full rounded-full" />
            </div>
          ))}
        </div>
      </section>

      {/* Safeguard strip */}
      <div className="rounded-2xl border border-border/60 p-5">
        <Skeleton className="h-3 w-32" />
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {["sg-1", "sg-2"].map((key) => (
            <div key={key} className="flex items-center gap-3">
              <Skeleton className="size-9 rounded-xl" />
              <div>
                <Skeleton className="h-5 w-8" />
                <Skeleton className="mt-1 h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
