import { type ReactNode } from "react";
import { AppNavbar } from "@/components/navigation/app-navbar";
import { ConvexClientProvider } from "@/providers/convex-client-provider";

/**
 * Static shell for authenticated routes.
 *
 * @remarks
 * Keep this layout synchronous. With Cache Components enabled, moving
 * request-time auth or Convex work into the layout blocks the whole `(app)`
 * subtree unless it sits below an explicit route-local `<Suspense>` boundary.
 * Each protected page owns its own async auth/data work instead.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <ConvexClientProvider>
      <div className="flex h-svh flex-col overflow-hidden bg-background">
        <AppNavbar />
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-none">{children}</div>
      </div>
    </ConvexClientProvider>
  );
}
