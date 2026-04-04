import { Suspense } from "react";
import { ClientAuthBoundary } from "@/lib/client-auth-boundary";
import { requireOrganizationToken } from "@/lib/auth/guards";
import { preloadAuthQuery } from "@/lib/auth-server";
import { ConvexClientProvider } from "@/app/convex-client-provider";
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
      <ClientAuthBoundary>
        <MeetingsLive preloadedMeetings={preloadedMeetings} />
      </ClientAuthBoundary>
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
