import { Suspense } from "react";
import { ClientAuthBoundary } from "@/lib/auth/auth-boundary";
import { requireOrganizationToken } from "@/lib/auth/guards";
import { preloadAuthQuery } from "@/lib/auth/auth-server";
import { ConvexClientProvider } from "@/providers/convex-client-provider";
import { api } from "../../../../convex/_generated/api";
import ReportsLoading from "./loading";
import { ReportsClient } from "./reports-client";

async function ReportsPageContent() {
  const [{ token }, preloadedOverview] = await Promise.all([
    requireOrganizationToken(),
    preloadAuthQuery(api.reports.overview),
  ]);

  return (
    <ConvexClientProvider initialToken={token}>
      <ClientAuthBoundary>
        <ReportsClient preloadedOverview={preloadedOverview} />
      </ClientAuthBoundary>
    </ConvexClientProvider>
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
