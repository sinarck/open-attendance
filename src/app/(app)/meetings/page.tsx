import { requireOrganizationToken } from "@/lib/auth/guards";
import { preloadAuthQuery } from "@/lib/auth/server";
import { ConvexClientProvider } from "@/providers/convex-client-provider";
import { api } from "../../../../convex/_generated/api";
import { MeetingsLive } from "./meetings-live";

export default async function MeetingsPage() {
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
