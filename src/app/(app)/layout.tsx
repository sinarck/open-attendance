import { type ReactNode, Suspense } from "react";
import { AppNavbar } from "@/components/navigation/app-navbar";
import { Skeleton } from "@/components/ui/skeleton";
import { requireOrganizationAccess } from "@/lib/auth/guards";
import { ConvexClientProvider } from "@/providers/convex-client-provider";

async function AppLayoutInner({ children }: { children: ReactNode }) {
  const { token } = await requireOrganizationAccess();

  return (
    <ConvexClientProvider initialToken={token}>
      <div className="flex min-h-svh flex-col">
        <AppNavbar />
        {children}
      </div>
    </ConvexClientProvider>
  );
}

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh flex-col">
          <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-lg">
            <div className="flex h-12 items-center gap-6 px-4 sm:px-6">
              <Skeleton className="h-4 w-32" />
              <div className="hidden items-center gap-2 md:flex">
                {["nav-1", "nav-2", "nav-3", "nav-4"].map((key) => (
                  <Skeleton key={key} className="h-8 w-24 rounded-md" />
                ))}
              </div>
              <div className="flex-1" />
              <Skeleton className="size-7 rounded-full" />
              <Skeleton className="size-8 rounded-lg md:hidden" />
            </div>
          </header>

          <main className="space-y-8 p-4 pb-12 sm:p-6 sm:pb-16">
            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {["kpi-1", "kpi-2", "kpi-3", "kpi-4"].map((key) => (
                <div key={key} className="rounded-2xl border border-border/60 p-5">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="mt-4 h-8 w-16" />
                  <Skeleton className="mt-2 h-3.5 w-28" />
                </div>
              ))}
            </section>

            <div className="rounded-2xl border border-border/60 p-6 sm:p-7">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="mt-4 h-7 w-48" />
              <Skeleton className="mt-4 h-3 w-64 max-w-full" />
              <Skeleton className="mt-5 h-2.5 w-full rounded-full" />
            </div>

            <section className="grid gap-6 xl:grid-cols-2">
              {["panel-1", "panel-2"].map((key) => (
                <div key={key} className="space-y-4">
                  <div className="flex items-baseline justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                  {["row-1", "row-2", "row-3"].map((rowKey) => (
                    <div key={rowKey} className="rounded-xl border border-border/60 p-4">
                      <Skeleton className="h-3.5 w-36" />
                      <Skeleton className="mt-2 h-3 w-48 max-w-full" />
                      <Skeleton className="mt-4 h-1.5 w-full rounded-full" />
                    </div>
                  ))}
                </div>
              ))}
            </section>
          </main>
        </div>
      }
    >
      <AppLayoutInner>{children}</AppLayoutInner>
    </Suspense>
  );
}
