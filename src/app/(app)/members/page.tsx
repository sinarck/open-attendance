import { requireOrganizationAccess } from "@/lib/auth/guards";
import { preloadAuthQuery } from "@/lib/auth/server";
import { api } from "../../../../convex/_generated/api";
import { MembersLive } from "./members-live";

export default async function MembersPage() {
  const [{ organization }, preloadedRoster] = await Promise.all([
    requireOrganizationAccess(),
    preloadAuthQuery(api.members.listRoster),
  ]);

  return <MembersLive preloadedRoster={preloadedRoster} timeZone={organization.timezone} />;
}
