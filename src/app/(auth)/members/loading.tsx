import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function MembersLoading() {
  return (
    <main className="mx-auto max-w-5xl px-page py-24">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-28" />
          <Skeleton className="mt-2 h-5 w-56" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-28" />
          </CardHeader>
          <CardContent className="space-y-4">
            {["m-1", "m-2", "m-3", "m-4", "m-5", "m-6", "m-7", "m-8"].map(
              (key) => (
                <Skeleton key={key} className="h-14 w-full" />
              ),
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
