import { Suspense } from "react";
import { ClientAuthBoundary } from "@/lib/auth/auth-boundary";
import { requireOrganization } from "@/lib/auth/guards";
import { preloadAuthQuery } from "@/lib/auth/auth-server";
import { api } from "../../../../convex/_generated/api";
import ReportsLoading from "./loading";
import { ReportsLive } from "./reports-live";

async function ReportsPageContent() {
  const [, preloadedOverview] = await Promise.all([
    requireOrganization(),
    preloadAuthQuery(api.reports.overview),
  ]);

  return (
    <ClientAuthBoundary>
      <ReportsLive preloadedOverview={preloadedOverview} />
    </ClientAuthBoundary>
  );
}

/**
 * Protected reports route entry.
 *
 * @remarks
 * Keep the route export synchronous so auth checks, preloading, and token
 * seeding happen under the route-local `<Suspense>` boundary.
 */
export default function ReportsPage() {
  return (
    <Suspense fallback={<ReportsLoading />}>
      <ReportsPageContent />
    </Suspense>
  );
}
