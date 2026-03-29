import { type ReactNode, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { AppLayoutContent } from "./app-layout-content";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh flex-col">
          <div className="border-b border-border/60 px-4 py-3 sm:px-6">
            <Skeleton className="h-5 w-32" />
          </div>
          <div className="space-y-4 p-4 sm:p-6">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-72 max-w-full" />
          </div>
        </div>
      }
    >
      <AppLayoutContent>{children}</AppLayoutContent>
    </Suspense>
  );
}
