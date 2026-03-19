import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ReportsLoading() {
  return (
    <main className="space-y-6 p-4 sm:p-6">
      <div className="grid gap-3 sm:grid-cols-3">
        {["stat-1", "stat-2", "stat-3"].map((key) => (
          <Card key={key}>
            <CardContent className="pt-5 pb-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-2 h-7 w-12" />
              <Skeleton className="mt-1.5 h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-4 w-24" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-[1fr_140px_140px_120px] border-b py-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-12" />
          </div>
          {["trend-1", "trend-2", "trend-3"].map((key) => (
            <div
              key={key}
              className="grid grid-cols-[1fr_140px_140px_120px] items-center border-b py-2 last:border-0"
            >
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-20" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-10 rounded-full" />
                <Skeleton className="h-5 w-8 rounded-full" />
              </div>
              <Skeleton className="h-6 w-14 rounded-full" />
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-[1fr_160px_120px] border-b py-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-12" />
          </div>
          {["member-1", "member-2", "member-3"].map((key) => (
            <div
              key={key}
              className="grid grid-cols-[1fr_160px_120px] items-center border-b py-2 last:border-0"
            >
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-6 w-14 rounded-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    </main>
  );
}
