import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function SessionsLoading() {
  return (
    <main className="mx-auto max-w-5xl px-page py-24">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-24" />
          <Skeleton className="mt-2 h-5 w-52" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-28" />
          </CardHeader>
          <CardContent className="space-y-4">
            {["s-1", "s-2", "s-3", "s-4", "s-5", "s-6"].map((key) => (
              <Skeleton key={key} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
