"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFingerprint } from "@/hooks/use-fingerprint";
import { useGeolocation } from "@/hooks/use-geolocation";
import { useTokenCountdown } from "@/hooks/use-token-countdown";
import { checkinInput } from "@/schema/checkin";
import { trpc } from "@/utils/trpc";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import type { inferRouterOutputs } from "@trpc/server";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { toast } from "sonner";
import type { AppRouter } from "../../../../server/src/routers";

export default function CheckinPage() {
  const params = useSearchParams();
  const token = useMemo(() => params.get("token") ?? "", [params]);
  const { geo, error: geoError } = useGeolocation(Boolean(token));
  const { fingerprint: deviceFingerprint } = useFingerprint(Boolean(token));
  const { remainingMs, formatted, isExpired } = useTokenCountdown(token);

  type RouterOutputs = inferRouterOutputs<AppRouter>;
  type ValidateAndCreateOutput = RouterOutputs["checkin"]["validateAndCreate"];

  const mutation = useMutation(
    trpc.checkin.validateAndCreate.mutationOptions({
      onSuccess: (data: ValidateAndCreateOutput) => {
        const name = data?.attendee?.name;
        toast.success(
          name ? `Successfully checked in ${name}!` : "Successfully checked in!"
        );
      },
      onError: (error: any) => {
        const message = error.message || "Check-in failed";
        toast.error(message);
      },
    })
  );

  const form = useForm({
    defaultValues: {
      userId: "",
    },
    onSubmit: async ({ value }) => {
      if (!geo || !token || !deviceFingerprint) return;
      mutation.mutate({
        token,
        userId: value.userId,
        geo: { lat: geo.lat, lng: geo.lng, accuracyM: geo.accuracyM },
        deviceFingerprint,
      });
    },
    validators: {
      onSubmit: ({ value }) => {
        const result = checkinInput({
          token,
          userId: value.userId,
          geo: geo || { lat: 0, lng: 0, accuracyM: 0 },
          deviceFingerprint: deviceFingerprint || "",
        });

        if (typeof result === "object" && (result as any).problems) {
          return {
            fields: {
              userId: ["User ID must be exactly 6 digits"],
            },
          };
        }
      },
    },
  });

  if (!token) {
    return (
      <div className="mx-auto w-full mt-10 max-w-md p-6">
        <Card>
          <CardHeader>
            <CardTitle>Invalid Check-in</CardTitle>
            <CardDescription>No valid token found in URL</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-svh overflow-hidden md:overflow-visible flex items-center justify-center p-6">
      <div className="w-full flex flex-col items-center gap-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Event Check-in</CardTitle>
            {typeof remainingMs === "number" ? (
              <CardDescription>Time remaining: {formatted}</CardDescription>
            ) : null}
            <CardDescription>
              Enter your 6-digit user ID to check in to the event
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isExpired && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm">
                  This check-in link has expired. Please scan the QR code again.
                </p>
              </div>
            )}
            {geoError ? (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm">
                  Location error: {geoError}
                </p>
                <p className="text-red-500 text-xs mt-1">
                  Please enable location access and refresh the page
                </p>
              </div>
            ) : !geo ? (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-blue-600 text-sm">
                  Getting your location...
                </p>
              </div>
            ) : null}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                form.handleSubmit();
              }}
            >
              <div className="flex flex-col gap-6">
                <div className="grid gap-3">
                  <form.Field name="userId">
                    {(field) => (
                      <div className="grid gap-3">
                        <Label htmlFor={field.name}>User ID (6 digits)</Label>
                        <Input
                          id={field.name}
                          name={field.name}
                          inputMode="numeric"
                          maxLength={6}
                          placeholder="123456"
                          autoFocus
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          required
                        />
                        {field.state.meta.errors.map((error, idx) => (
                          <p key={idx} className="text-red-500 text-sm">
                            {String(error)}
                          </p>
                        ))}
                      </div>
                    )}
                  </form.Field>
                </div>

                <div className="flex flex-col gap-3">
                  <form.Subscribe>
                    {(state) => (
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={
                          !state.canSubmit ||
                          state.isSubmitting ||
                          !geo ||
                          !!geoError ||
                          !deviceFingerprint ||
                          isExpired
                        }
                      >
                        {state.isSubmitting ? "Checking in..." : "Check In"}
                      </Button>
                    )}
                  </form.Subscribe>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Debug info */}
        {process.env.NODE_ENV === "development" &&
          (geo || deviceFingerprint) && (
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="text-sm">Debug Info</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs space-y-1 font-mono">
                  {geo && (
                    <>
                      <div>Lat: {geo.lat.toFixed(6)}</div>
                      <div>Lng: {geo.lng.toFixed(6)}</div>
                      <div>Accuracy: {geo.accuracyM.toFixed(1)}m</div>
                    </>
                  )}

                  {deviceFingerprint && (
                    <div className="pt-2 border-t">
                      <div className="text-gray-600 mb-1">Device ID:</div>
                      <div className="break-all">{deviceFingerprint}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
      </div>
    </div>
  );
}

