import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ReportsLoading() {
  return (
    <main className="mx-auto max-w-5xl px-page py-24">
      <div>
        <Skeleton className="h-8 w-24" />
        <Skeleton className="mt-2 h-5 w-48" />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {["stat-1", "stat-2", "stat-3"].map((key) => (
          <Card key={key}>
            <CardHeader className="flex-row items-center justify-between pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="size-5" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-9 w-20" />
              <Skeleton className="mt-2 h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="mt-1 h-4 w-44" />
          </CardHeader>
          <CardContent className="space-y-4">
            {["trend-1", "trend-2", "trend-3"].map((key) => (
              <Skeleton key={key} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="mt-1 h-4 w-44" />
          </CardHeader>
          <CardContent className="space-y-4">
            {["session-1", "session-2", "session-3"].map((key) => (
              <Skeleton key={key} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
