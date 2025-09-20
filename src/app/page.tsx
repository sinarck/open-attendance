"use client";

import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { meetingConfig } from "@/config/meeting";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/trpc/client";

export default function Home() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const [broadcasting, setBroadcasting] = useState(true);

  const { data: meetingToken, isPending: isMeetingTokenPending } =
    trpc.meeting.generateToken.useQuery(undefined, {
      enabled: !!session && broadcasting,
      refetchInterval: broadcasting
        ? meetingConfig.refreshIntervalMs
        : undefined,
      retry: false,
      throwOnError: true,
    });

  if (!session && !isPending) {
    return (
      <div className="container mx-auto min-h-full flex items-center justify-center">
        Not logged in
      </div>
    );
  }

  if (isPending || (session && broadcasting && isMeetingTokenPending)) {
    return (
      <div className="container mx-auto flex flex-col items-center justify-center min-h-full gap-8">
        <Skeleton className="w-[clamp(320px,70vmin,900px)] aspect-square" />
      </div>
    );
  }

  const url =
    broadcasting && typeof window !== "undefined" && meetingToken?.token
      ? `${window.location.origin}/check-in?token=${encodeURIComponent(meetingToken.token)}`
      : "";

  return (
    <div className="container mx-auto flex flex-col items-center justify-center min-h-full gap-8">
      {url ? (
        <QRCodeSVG
          value={url}
          className="w-[clamp(320px,70vmin,900px)] h-auto aspect-square"
        />
      ) : (
        <div className="w-[clamp(320px,70vmin,900px)] aspect-square flex items-center justify-center border rounded-md text-muted-foreground">
          {broadcasting ? "No token" : "QR paused"}
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button
          variant={broadcasting ? "destructive" : "default"}
          onClick={() => setBroadcasting((v) => !v)}
        >
          {broadcasting ? "Stop" : "Start"} QR
        </Button>
      </div>

      {process.env.NODE_ENV !== "production" ? (
        <Button
          onClick={() => {
            if (meetingToken?.token && broadcasting) {
              router.push(`/check-in?token=${meetingToken?.token}`);
            }
          }}
          disabled={!broadcasting || !meetingToken?.token}
        >
          Check In
        </Button>
      ) : null}
    </div>
  );
}
