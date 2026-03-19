import { Skeleton } from "@/components/ui/skeleton";

export default function MeetingsLoading() {
  return (
    <main className="space-y-6 p-4 sm:p-6">
      <section>
        <div className="mb-2 flex items-center gap-2">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-5 w-8 rounded-full" />
        </div>
        <div className="rounded-lg border px-4 py-2">
          <div className="grid grid-cols-[1fr_120px_160px] border-b py-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-14" />
          </div>
          {["s-1", "s-2", "s-3"].map((key) => (
            <div
              key={key}
              className="grid grid-cols-[1fr_120px_160px] items-center border-b py-2 last:border-0"
            >
              <div className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-28" />
              </div>
              <Skeleton className="h-5 w-16" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-14 rounded-full" />
                <Skeleton className="size-3 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </section>
      <section>
        <div className="mb-2 flex items-center gap-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-5 w-8 rounded-full" />
        </div>
        <div className="rounded-lg border px-4 py-2">
          <div className="grid grid-cols-[1fr_120px_160px] border-b py-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-14" />
          </div>
          {["c-1", "c-2", "c-3", "c-4"].map((key) => (
            <div
              key={key}
              className="grid grid-cols-[1fr_120px_160px] items-center border-b py-2 last:border-0"
            >
              <div className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-28" />
              </div>
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-6 w-14 rounded-full" />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
