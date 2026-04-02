import { Suspense } from "react";
import { requireOrganizationToken } from "@/lib/auth/guards";
import { preloadAuthQuery } from "@/lib/auth/server";
import { ConvexClientProvider } from "@/providers/convex-client-provider";
import { api } from "../../../../convex/_generated/api";
import MeetingsLoading from "./loading";
import { MeetingsLive } from "./meetings-live";

async function MeetingsPageContent() {
  const [{ token }, preloadedMeetings] = await Promise.all([
    requireOrganizationToken(),
    preloadAuthQuery(api.meetings.list),
  ]);

  return (
    <ConvexClientProvider initialToken={token}>
      <MeetingsLive preloadedMeetings={preloadedMeetings} />
    </ConvexClientProvider>
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
