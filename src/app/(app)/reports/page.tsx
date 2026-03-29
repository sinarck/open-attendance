import { preloadAuthQuery } from "@/lib/auth/server";
import { api } from "../../../../convex/_generated/api";
import { ReportsLive } from "./reports-live";

export default async function ReportsPage() {
  const preloadedOverview = await preloadAuthQuery(api.reports.overview);

  return <ReportsLive preloadedOverview={preloadedOverview} />;
}
