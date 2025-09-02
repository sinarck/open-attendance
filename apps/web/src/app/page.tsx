"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CONFIG } from "@/config";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";

export default function Home() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const { data: meetingToken, isPending: isMeetingTokenPending } = useQuery({
    ...trpc.meeting.generateToken.queryOptions({
      meetingId: "123",
    }),
    enabled: !!session,
    refetchInterval: CONFIG.qr.refreshIntervalMs,
  });

  // If session has resolved and is missing, show not logged in immediately.
  if (!session && !isPending) {
    return <div>Not logged in</div>;
  }

  // Only consider token loading when we have a session.
  if (isPending || (session && isMeetingTokenPending)) {
    return (
      <div className="container mx-auto flex flex-col items-center justify-center h-full gap-8">
        <Skeleton className="w-[clamp(320px,70vmin,900px)] aspect-square" />
      </div>
    );
  }

  const url =
    typeof window !== "undefined" && meetingToken?.token
      ? `${window.location.origin}/checkin?token=${encodeURIComponent(
          meetingToken.token
        )}`
      : "";

  return (
    <div className="container mx-auto flex flex-col items-center justify-center h-full gap-8">
      {url ? (
        <QRCodeSVG
          value={url}
          className="w-[clamp(320px,70vmin,900px)] h-auto aspect-square"
        />
      ) : null}
      {process.env.NODE_ENV !== "production" ? (
        <Button
          onClick={() => {
            router.push(`/checkin?token=${meetingToken?.token}`);
          }}
        >
          Check In
        </Button>
      ) : null}
    </div>
  );
}

