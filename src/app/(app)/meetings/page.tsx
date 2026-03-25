import { Suspense } from "react";
import { preloadAuthQuery } from "@/lib/auth-server";
import { api } from "../../../../convex/_generated/api";
import { MeetingsLive } from "./_components/meetings-live";
import MeetingsLoading from "./loading";

async function MeetingsRealtimeContent() {
  const preloadedMeetings = await preloadAuthQuery(api.meetings.list);

  return <MeetingsLive preloadedMeetings={preloadedMeetings} />;
}

export default function MeetingsPage() {
  return (
    <Suspense fallback={<MeetingsLoading />}>
      <MeetingsRealtimeContent />
    </Suspense>
  );
}
