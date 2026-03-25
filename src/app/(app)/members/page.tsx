import { Suspense } from "react";
import { preloadAuthQuery } from "@/lib/auth-server";
import { api } from "../../../../convex/_generated/api";
import { MembersLive } from "./_components/members-live";
import MembersLoading from "./loading";

async function MembersRealtimeContent() {
  const preloadedRoster = await preloadAuthQuery(api.members.listRoster);

  return <MembersLive preloadedRoster={preloadedRoster} />;
}

export default function MembersPage() {
  return (
    <Suspense fallback={<MembersLoading />}>
      <MembersRealtimeContent />
    </Suspense>
  );
}
