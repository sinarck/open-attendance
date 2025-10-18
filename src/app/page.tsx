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
  const [broadcasting, setBroadcasting] = useState(false);

  const { data: meetingToken, isPending: isMeetingTokenPending } =
    trpc.meeting.generateToken.useQuery(undefined, {
      enabled: !!session && broadcasting,
      refetchInterval: broadcasting
        ? meetingConfig.refreshIntervalMs
        : undefined,
      retry: false,
      throwOnError: true,
    });

  const { data: meeting, isPending: isMeetingPending } =
    trpc.meeting.current.useQuery(undefined, {
      enabled: !!session,
      refetchInterval: broadcasting
        ? meetingConfig.refreshIntervalMs
        : undefined,
      retry: false,
    });

  if (!session && !isPending) {
    return (
      <div className="container mx-auto min-h-full flex items-center justify-center">
        Not logged in
      </div>
    );
  }

  // Compute a simple time range string (no hooks to avoid conditional hook warnings)
  const timeWindow = meeting
    ? (() => {
        const fmt = (d: Date) =>
          new Intl.DateTimeFormat(undefined, {
            hour: "2-digit",
            minute: "2-digit",
          }).format(d);
        return `${fmt(new Date(meeting.startAt))} – ${fmt(new Date(meeting.endAt))}`;
      })()
    : null;

  if (
    isPending ||
    (session && broadcasting && (isMeetingTokenPending || isMeetingPending))
  ) {
    return (
      <div className="mx-auto w-full h-full flex items-center justify-center p-4">
        <Skeleton className="w-[clamp(320px,70vmin,900px)] aspect-square" />
      </div>
    );
  }

  const url =
    broadcasting && typeof window !== "undefined" && meetingToken?.token
      ? `${window.location.origin}/check-in?token=${encodeURIComponent(meetingToken.token)}`
      : "";

  return (
    <div className="mx-auto w-full h-full overflow-hidden pt-0 md:pt-1">
      <div className="grid h-full w-full grid-rows-[auto_1fr_auto] gap-3 md:gap-4">
        {/* Header */}
        <header className="flex items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-balance text-2xl font-semibold tracking-tight md:text-3xl">
              {meeting ? meeting.name : "Attendance"}
            </h1>
            <p className="text-sm text-muted-foreground truncate">
              {meeting ? timeWindow : "No active meeting"}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Button
              size="lg"
              variant={broadcasting ? "destructive" : "default"}
              onClick={() => setBroadcasting((v) => !v)}
            >
              {broadcasting ? "Stop checking in" : "Start checking in"}
            </Button>
            {process.env.NODE_ENV !== "production" ? (
              <Button
                onClick={() => {
                  if (meetingToken?.token && broadcasting) {
                    router.push(`/check-in?token=${meetingToken?.token}`);
                  }
                }}
                disabled={!broadcasting || !meetingToken?.token}
                variant="outline"
              >
                Dev: Open Check-In
              </Button>
            ) : null}
          </div>
        </header>

        {/* QR Area */}
        <section className="relative flex items-center justify-center">
          <div className="aspect-square w-[min(85vmin,75svh)] max-w-full">
            {url ? (
              <div className="w-full h-full rounded-xl border bg-background p-4">
                <QRCodeSVG
                  value={url}
                  className="w-full h-full"
                  includeMargin
                />
              </div>
            ) : (
              <div className="grid place-items-center size-full border rounded-xl bg-muted/20">
                <div className="text-sm text-muted-foreground">
                  Check-in is paused
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
