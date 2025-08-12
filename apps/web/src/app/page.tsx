"use client";

import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";

export default function Home() {
  const { data: session, isPending } = authClient.useSession();
  const { data: meetingToken } = useQuery(
    trpc.meeting.generateToken.queryOptions({
      meetingId: "123",
    })
  );

  if (isPending) {
    return <div>Loading...</div>;
  }

  if (!session) {
    return <div>Not logged in</div>;
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-2">
      <h1>{meetingToken?.token}</h1>
    </div>
  );
}
