import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { type ReactNode, Suspense } from "react";
import { AppSidebar } from "@/components/navigation/app-sidebar";
import { AppProviders } from "@/components/providers";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { getToken, isAuthenticated } from "@/lib/auth-server";

/**
 * Async server component that handles auth gating and renders the full
 * app shell. Wrapped in <Suspense> by the layout so PPR can prerender
 * the static fallback and stream this in once auth resolves.
 */
async function AppShell({ children }: { children: ReactNode }) {
  const [authed, token, cookieStore] = await Promise.all([
    isAuthenticated(),
    getToken(),
    cookies(),
  ]);

  if (!authed) {
    redirect("/login");
  }

  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";

  return (
    <AppProviders initialToken={token}>
      <SidebarProvider defaultOpen={defaultOpen}>
        <AppSidebar />
        <SidebarInset>{children}</SidebarInset>
      </SidebarProvider>
    </AppProviders>
  );
}

/**
 * Skeleton fallback for the app shell while auth + sidebar state resolve.
 * Mirrors the sidebar + content inset structure.
 */
function AppShellFallback() {
  return (
    <div className="flex min-h-svh w-full">
      {/* Sidebar skeleton */}
      <div className="w-[--sidebar-width] shrink-0 border-r p-4">
        <Skeleton className="mb-6 h-5 w-28" />
        <div className="space-y-2">
          {["nav-1", "nav-2", "nav-3", "nav-4"].map((key) => (
            <Skeleton key={key} className="h-8 w-full rounded-md" />
          ))}
        </div>
      </div>
      {/* Content area skeleton */}
      <div className="flex-1 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-2 h-5 w-72" />
      </div>
    </div>
  );
}

/**
 * PPR-compatible app layout. The layout itself is synchronous so its
 * shell can be prerendered. The dynamic auth check + sidebar state
 * resolution happen inside <AppShell>, which streams in via Suspense.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<AppShellFallback />}>
      <AppShell>{children}</AppShell>
    </Suspense>
  );
}
