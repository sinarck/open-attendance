import { Skeleton } from "@/components/ui/skeleton";

export default function MembersLoading() {
  return (
    <main className="space-y-6 p-4 sm:p-6">
      <section>
        <div className="mb-2 flex items-center gap-2">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-5 w-8 rounded-full" />
        </div>
        <div className="rounded-lg border px-4 py-2">
          <div className="grid grid-cols-[1fr_160px_100px] border-b py-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-12" />
          </div>
          {["m-1", "m-2", "m-3", "m-4"].map((key) => (
            <div
              key={key}
              className="grid grid-cols-[1fr_160px_100px] items-center border-b py-2 last:border-0"
            >
              <div className="flex items-center gap-2.5">
                <Skeleton className="size-7 rounded-full" />
                <Skeleton className="h-4 w-28" />
              </div>
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-4 w-12" />
            </div>
          ))}
        </div>
      </section>
      <section>
        <div className="mb-2 flex items-center gap-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-5 w-8 rounded-full" />
        </div>
        <div className="rounded-lg border px-4 py-2">
          <div className="grid grid-cols-[1fr_160px] border-b py-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
          {["a-1", "a-2"].map((key) => (
            <div
              key={key}
              className="grid grid-cols-[1fr_160px] items-center border-b py-2 last:border-0 opacity-50"
            >
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-5 w-20" />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
