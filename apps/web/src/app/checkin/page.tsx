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
import { trpc } from "@/utils/trpc";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import z from "zod";

export default function CheckinPage() {
  const params = useSearchParams();
  const token = useMemo(() => params.get("token") ?? "", [params]);
  const [geo, setGeo] = useState<{
    lat: number;
    lng: number;
    accuracyM: number;
  } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);

  const mutation = useMutation(
    trpc.checkin.validateAndCreate.mutationOptions({
      onSuccess: (res) => {
        toast.success(
          res.status === "already"
            ? "Already checked in!"
            : "Successfully checked in!"
        );
      },
      onError: (error) => {
        toast.error(error.message || "Check-in failed");
      },
    })
  );

  const form = useForm({
    defaultValues: {
      userId: "",
    },
    onSubmit: async ({ value }) => {
      if (!geo || !token) return;
      mutation.mutate({
        token,
        userId: value.userId,
        geo: { lat: geo.lat, lng: geo.lng, accuracyM: geo.accuracyM },
      });
    },
    validators: {
      onSubmit: z.object({
        userId: z.string().regex(/^\d{6}$/, "User ID must be exactly 6 digits"),
      }),
    },
  });

  useEffect(() => {
    let cancelled = false;
    if (!token) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (cancelled) return;
        setGeo({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracyM: pos.coords.accuracy ?? 9999,
        });
      },
      (err) => {
        if (cancelled) return;
        setGeoError(err.message || "Location access required");
      },
      { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 }
    );

    return () => {
      cancelled = true;
    };
  }, [token]);

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
    <div className="mx-auto w-full mt-10 max-w-md p-6 flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Event Check-in</CardTitle>
          <CardDescription>
            Enter your 6-digit user ID to check in to the event
          </CardDescription>
        </CardHeader>
        <CardContent>
          {geoError ? (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">Location error: {geoError}</p>
              <p className="text-red-500 text-xs mt-1">
                Please enable location access and refresh the page
              </p>
            </div>
          ) : !geo ? (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-blue-600 text-sm">Getting your location...</p>
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
                        pattern="^\d{6}$"
                        maxLength={6}
                        placeholder="123456"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        required
                      />
                      {field.state.meta.errors.map((error) => (
                        <p
                          key={error?.message}
                          className="text-red-500 text-sm"
                        >
                          {error?.message}
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
                        !!geoError
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

      {/* Debug location info */}
      {geo && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Debug: Location Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs space-y-1 font-mono">
              <div>Lat: {geo.lat.toFixed(6)}</div>
              <div>Lng: {geo.lng.toFixed(6)}</div>
              <div>Accuracy: {geo.accuracyM.toFixed(1)}m</div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

