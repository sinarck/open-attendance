import { type ReactNode, Suspense } from "react";
import { AppNavbar } from "@/components/navigation/app-navbar";
import { AppProviders } from "@/components/providers";
import { Skeleton } from "@/components/ui/skeleton";
import { requireAppContext } from "@/lib/app-context";

async function AuthenticatedContent({ children }: { children: ReactNode }) {
  const { viewer, token } = await requireAppContext();
  return (
    <AppProviders initialToken={token} viewer={viewer}>
      <div className="flex min-h-svh flex-col">
        <AppNavbar viewer={viewer} />
        {children}
      </div>
    </AppProviders>
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
          <div className="p-6">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="mt-2 h-5 w-72" />
          </div>
        </div>
      }
    >
      <AuthenticatedContent>{children}</AuthenticatedContent>
    </Suspense>
  );
}
