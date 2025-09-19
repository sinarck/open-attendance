"use client";

import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { meetingConfig } from "@/config/meeting";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/trpc/client";

export default function Home() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();

  const { data: meetingToken, isPending: isMeetingTokenPending } =
    trpc.meeting.generateToken.useQuery(undefined, {
      enabled: !!session,
      refetchInterval: meetingConfig.refreshIntervalMs,
      throwOnError: true,
    });

  if (!session && !isPending) {
    return (
      <div className="container mx-auto h-full flex items-center justify-center">
        Not logged in
      </div>
    );
  }

  if (isPending || (session && isMeetingTokenPending)) {
    return (
      <div className="container mx-auto flex flex-col items-center justify-center h-full gap-8">
        <Skeleton className="w-[clamp(320px,70vmin,900px)] aspect-square" />
      </div>
    );
  }

  const url =
    typeof window !== "undefined" && meetingToken?.token
      ? `${window.location.origin}/check-in?token=${encodeURIComponent(meetingToken.token)}`
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
            router.push(`/check-in?token=${meetingToken?.token}`);
          }}
        >
          Check In
        </Button>
      ) : null}
    </div>
  );
}
