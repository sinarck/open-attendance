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
      <AppLayoutInner>{children}</AppLayoutInner>
    </Suspense>
  );
}
