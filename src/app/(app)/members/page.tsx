import { requireOrganizationToken } from "@/lib/auth/guards";
import { preloadAuthQuery } from "@/lib/auth/server";
import { ConvexClientProvider } from "@/providers/convex-client-provider";
import { api } from "../../../../convex/_generated/api";
import { MembersLive } from "./members-live";

export default async function MembersPage() {
  const [{ organization, token }, preloadedRoster] = await Promise.all([
    requireOrganizationToken(),
    preloadAuthQuery(api.members.listRoster),
  ]);

  return (
    <ConvexClientProvider initialToken={token}>
      <MembersLive preloadedRoster={preloadedRoster} timeZone={organization.timezone} />
    </ConvexClientProvider>
  );
}
