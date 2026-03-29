import { preloadAuthQuery } from "@/lib/auth/server";
import { api } from "../../../../convex/_generated/api";
import { MeetingsLive } from "./meetings-live";

export default async function MeetingsPage() {
  const preloadedMeetings = await preloadAuthQuery(api.meetings.list);

  return <MeetingsLive preloadedMeetings={preloadedMeetings} />;
}
