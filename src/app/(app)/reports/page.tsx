import { requireOrganizationToken } from "@/lib/auth/guards";
import { preloadAuthQuery } from "@/lib/auth/server";
import { ConvexClientProvider } from "@/providers/convex-client-provider";
import { api } from "../../../../convex/_generated/api";
import { ReportsLive } from "./reports-live";

export default async function ReportsPage() {
  const [{ token }, preloadedOverview] = await Promise.all([
    requireOrganizationToken(),
    preloadAuthQuery(api.reports.overview),
  ]);

  return (
    <ConvexClientProvider initialToken={token}>
      <ReportsLive preloadedOverview={preloadedOverview} />
    </ConvexClientProvider>
  );
}
