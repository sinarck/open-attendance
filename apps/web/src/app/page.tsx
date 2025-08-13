"use client";

import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";

export default function Home() {
  const { data: session, isPending } = authClient.useSession();
  const { data: meetingToken, isPending: isMeetingTokenPending } = useQuery({
    ...trpc.meeting.generateToken.queryOptions({
      meetingId: "123",
    }),
    enabled: !!session,
    refetchInterval: 15 * 1000,
  });
  const token = meetingToken?.token;

  if (isPending || isMeetingTokenPending) {
    return <div>Loading...</div>;
  }

  if (!session) {
    return <div>Not logged in</div>;
  }

  return (
    <div className="container mx-auto flex flex-col items-center justify-center h-screen">
      {token ? <QRCodeSVG value={token} size={256} /> : null}
    </div>
  );
}
