import { type ReactNode } from "react";
import { AppNavbar } from "@/components/navigation/app-navbar";

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
    <div className="flex min-h-svh flex-col">
      <AppNavbar />
      {children}
    </div>
  );
}
