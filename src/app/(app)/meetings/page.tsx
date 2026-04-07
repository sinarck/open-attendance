import { Suspense } from "react";
import { ClientAuthBoundary } from "@/lib/auth/auth-boundary";
import { requireOrganization } from "@/lib/auth/guards";
import { preloadAuthQuery } from "@/lib/auth/auth-server";
import { api } from "../../../../convex/_generated/api";
import MeetingsLoading from "./loading";
import { MeetingsLive } from "./meetings-live";

async function MeetingsPageContent() {
  const [, preloadedMeetings] = await Promise.all([
    requireOrganization(),
    preloadAuthQuery(api.meetings.list),
  ]);

  return (
    <ClientAuthBoundary>
      <MeetingsLive preloadedMeetings={preloadedMeetings} />
    </ClientAuthBoundary>
  );
}

/**
 * Protected meetings route entry.
 *
 * @remarks
 * Keep the route export synchronous so auth checks, preloading, and token
 * seeding happen under the route-local `<Suspense>` boundary.
 */
export default function MeetingsPage() {
  return (
    <Suspense fallback={<MeetingsLoading />}>
      <MeetingsPageContent />
    </Suspense>
  );
}
