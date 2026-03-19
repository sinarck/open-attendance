import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <main className="space-y-6 p-4 sm:p-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {["stat-1", "stat-2", "stat-3", "stat-4"].map((key) => (
          <Card key={key}>
            <CardContent className="pt-5 pb-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="mt-2 h-7 w-12" />
              <Skeleton className="mt-1.5 h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="border-emerald-500/20 bg-emerald-500/5">
        <CardContent className="flex items-center gap-4 py-4">
          <Skeleton className="size-2 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-28" />
          </div>
        </CardContent>
      </Card>
      <div className="rounded-lg border px-4 py-2">
        <div className="py-3">
          <Skeleton className="h-4 w-28" />
        </div>
        <div className="grid grid-cols-[1fr_120px] border-t py-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-12" />
        </div>
        {["row-1", "row-2", "row-3", "row-4"].map((key) => (
          <div
            key={key}
            className="grid grid-cols-[1fr_120px] items-center border-t py-2"
          >
            <div className="space-y-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-6 w-14 rounded-full" />
          </div>
        ))}
      </div>
    </main>
  );
}
