import { redirect } from "next/navigation";
import { type ReactNode, Suspense } from "react";
import { AppSidebar } from "@/components/navigation/app-sidebar";
import { AppProviders } from "@/components/providers";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { getToken, isAuthenticated } from "@/lib/auth-server";

/**
 * Async server component that handles auth gating and wraps children
 * in the Convex/auth providers. Kept narrow so only the page content
 * area streams. The sidebar stays in the static shell.
 */
async function AuthenticatedContent({ children }: { children: ReactNode }) {
  const [authed, token] = await Promise.all([isAuthenticated(), getToken()]);

  if (!authed) {
    redirect("/login");
  }

  return <AppProviders initialToken={token}>{children}</AppProviders>;
}

/**
 * Skeleton fallback shown in the content area while auth resolves.
 * The sidebar is already visible, only this inner area streams.
 */
function ContentFallback() {
  return (
    <div className="p-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="mt-2 h-5 w-72" />
    </div>
  );
}

/**
 * PPR-compatible app layout. The sidebar and its provider are static
 * and prerendered immediately. Only the content area (auth check +
 * page) is deferred via Suspense.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Suspense fallback={<ContentFallback />}>
          <AuthenticatedContent>{children}</AuthenticatedContent>
        </Suspense>
      </SidebarInset>
    </SidebarProvider>
  );
}
