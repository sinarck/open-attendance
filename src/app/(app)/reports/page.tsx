import { Suspense } from "react";
import { requireAuthenticated } from "@/lib/auth/guards";
import { ReportsSectionsLoading } from "./loading";
import { ReportsContent } from "./reports-client";

async function ReportsPageContent() {
  await requireAuthenticated();

  return <ReportsContent />;
}

/**
 * Protected reports route entry.
 *
 * @remarks
 * Keep the route export synchronous so request-time auth stays under the
 * route-local `<Suspense>` boundary.
 */
export default function ReportsPage() {
  return (
    <main className="space-y-6 p-4 sm:p-6">
      <Suspense fallback={<ReportsSectionsLoading />}>
        <ReportsPageContent />
      </Suspense>
    </main>
  );
}
