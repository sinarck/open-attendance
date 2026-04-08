import { Suspense } from "react";
import { ClientAuthBoundary } from "@/lib/auth/auth-boundary";
import { requireOrganizationToken } from "@/lib/auth/guards";
import { preloadAuthQuery } from "@/lib/auth/auth-server";
import { ConvexClientProvider } from "@/providers/convex-client-provider";
import { api } from "../../../../convex/_generated/api";
import MembersLoading from "./loading";
import { MembersClient } from "./members-client";

async function MembersPageContent() {
  const [{ organization, token }, preloadedRoster] = await Promise.all([
    requireOrganizationToken(),
    preloadAuthQuery(api.members.listRoster),
  ]);

  return (
    <ConvexClientProvider initialToken={token}>
      <ClientAuthBoundary>
        <MembersClient preloadedRoster={preloadedRoster} timeZone={organization.timezone} />
      </ClientAuthBoundary>
    </ConvexClientProvider>
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
