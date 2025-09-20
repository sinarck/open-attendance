"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useFingerprint } from "@/hooks/use-fingerprint";
import { useGeolocation } from "@/hooks/use-geolocation";
import { usePlatformHelp } from "@/hooks/use-platform-help";
import { useTokenCountdown } from "@/hooks/use-token-countdown";
import { trpc } from "@/trpc/client";

export default function CheckinPage() {
  const params = useSearchParams();
  const router = useRouter();
  const token = useMemo(() => params.get("token") ?? "", [params]);
  const { reading: geo, error: geoError } = useGeolocation(Boolean(token));
  const { fingerprint: deviceFingerprint } = useFingerprint(Boolean(token));
  const { remainingMs, formatted, isExpired } = useTokenCountdown(token);
  const formSchema = z.object({
    userId: z.string().regex(/^\d{6}$/, "User ID must be exactly 6 digits"),
  });
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { userId: "" },
    mode: "onChange",
  });
  const { openLocationSettings, steps, ctaLabel } = usePlatformHelp();

  const mutation = trpc.checkin.verifyAndRecord.useMutation({
    onSuccess: (data) => {
      const name = (data as { attendee?: { name?: string | null } })?.attendee
        ?.name;
      const qs = name ? `?name=${encodeURIComponent(name)}` : "";
      router.push(`/check-in/success${qs}`);
    },
    onError: (error) => {
      toast.error(error.message || "Check-in failed");
    },
  });

  const onSubmit = useCallback(
    (values: z.infer<typeof formSchema>) => {
      if (!geo || !token || !deviceFingerprint) return;
      mutation.mutate({
        token,
        userId: values.userId,
        geo: { lat: geo.lat, lng: geo.lng, accuracyM: geo.accuracyM },
        deviceFingerprint,
      });
    },
    [deviceFingerprint, geo, mutation, token],
  );

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
    <div className="min-h-full flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      <div className="w-full flex flex-col items-center gap-6">
        <Card className="w-full max-w-md sm:max-w-lg rounded-xl shadow-lg">
          <CardHeader>
            <CardTitle>Meeting Check In</CardTitle>
            {typeof remainingMs === "number" ? (
              <CardDescription className="font-mono">
                Time remaining: {formatted}
              </CardDescription>
            ) : null}
            <CardDescription>
              Enter your 6-digit user ID to check in to the meeting
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isExpired && (
              <div className="mb-4 p-3 rounded-md border bg-destructive/10 border-destructive/20 text-destructive">
                <p className="text-sm">
                  This check-in link has expired. Please scan the QR code again.
                </p>
              </div>
            )}
            {geoError && (
              <div className="mb-4 p-3 rounded-md border bg-destructive/10 border-destructive/20 text-destructive">
                <p className="text-sm">Location error: {geoError}</p>
                <div className="text-xs mt-2 space-y-2 opacity-90">
                  <div className="flex items-center gap-2">
                    <span>Please enable location access and then refresh.</span>
                    {ctaLabel ? (
                      <button
                        type="button"
                        onClick={openLocationSettings}
                        className="ml-1 underline underline-offset-2"
                      >
                        {ctaLabel}
                      </button>
                    ) : null}
                  </div>

                  <Accordion
                    type="single"
                    collapsible
                    className="border rounded-md bg-background/40"
                  >
                    <AccordionItem value="how">
                      <AccordionTrigger className="px-3 py-2">
                        How to enable location
                      </AccordionTrigger>
                      <AccordionContent className="px-3">
                        <ol className="list-decimal pl-5 space-y-1">
                          {steps.map((s) => (
                            <li key={s}>{s}</li>
                          ))}
                        </ol>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              </div>
            )}
            {!geo && !geoError && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-blue-600 text-sm">
                  Getting your location...
                </p>
              </div>
            )}

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex flex-col gap-6"
              >
                <FormField
                  control={form.control}
                  name="userId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>User ID</FormLabel>
                      <FormControl>
                        <Input
                          inputMode="numeric"
                          maxLength={6}
                          placeholder="123456"
                          autoFocus
                          required
                          className="h-12 text-base sm:h-14 sm:text-lg"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex flex-col gap-3">
                  <Button
                    type="submit"
                    className="w-full h-12 text-base sm:h-14 sm:text-lg"
                    disabled={
                      !form.formState.isValid ||
                      mutation.isPending ||
                      !geo ||
                      !!geoError ||
                      !deviceFingerprint ||
                      isExpired
                    }
                  >
                    {mutation.isPending ? "Checking in..." : "Check In"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {process.env.NODE_ENV === "development" &&
          (geo || deviceFingerprint) && (
            <Card className="w-full max-w-md sm:max-w-lg rounded-xl shadow">
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
