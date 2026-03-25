import { Suspense } from "react";
import { preloadAuthQuery } from "@/lib/auth-server";
import { api } from "../../../../convex/_generated/api";
import { ReportsLive } from "./_components/reports-live";
import ReportsLoading from "./loading";

async function ReportsRealtimeContent() {
  const preloadedOverview = await preloadAuthQuery(api.reports.overview);

  return <ReportsLive preloadedOverview={preloadedOverview} />;
}

export default function ReportsPage() {
  return (
    <Suspense fallback={<ReportsLoading />}>
      <ReportsRealtimeContent />
    </Suspense>
  );
}
