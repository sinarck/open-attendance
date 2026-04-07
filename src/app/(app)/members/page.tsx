import { Suspense } from "react";
import { ClientAuthBoundary } from "@/lib/auth/auth-boundary";
import { requireOrganization } from "@/lib/auth/guards";
import { preloadAuthQuery } from "@/lib/auth/auth-server";
import { api } from "../../../../convex/_generated/api";
import MembersLoading from "./loading";
import { MembersLive } from "./members-live";

async function MembersPageContent() {
  const [organization, preloadedRoster] = await Promise.all([
    requireOrganization(),
    preloadAuthQuery(api.members.listRoster),
  ]);

  return (
    <ClientAuthBoundary>
      <MembersLive preloadedRoster={preloadedRoster} timeZone={organization.timezone} />
    </ClientAuthBoundary>
  );
}

/**
 * Protected members route entry.
 *
 * @remarks
 * Keep the route export synchronous so auth checks, preloading, and token
 * seeding happen under the route-local `<Suspense>` boundary.
 */
export default function MembersPage() {
  return (
    <Suspense fallback={<MembersLoading />}>
      <MembersPageContent />
    </Suspense>
  );
}
