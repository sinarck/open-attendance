import { Suspense } from "react";
import { requireOrganization } from "@/lib/auth/guards";
import { MembersSectionsLoading } from "./loading";
import { MembersPageShell, MembersRosterContent } from "./members-client";

async function MembersPageContent() {
  const organization = await requireOrganization();

  return <MembersRosterContent timeZone={organization.timezone} />;
}

/**
 * Protected members route entry.
 *
 * @remarks
 * Keep the route export synchronous so request-time auth and organization
 * lookup stay under the route-local `<Suspense>` boundary.
 */
export default function MembersPage() {
  return (
    <MembersPageShell>
      <Suspense fallback={<MembersSectionsLoading />}>
        <MembersPageContent />
      </Suspense>
    </MembersPageShell>
  );
}
