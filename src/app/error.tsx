"use client";

import posthog from "posthog-js";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const capturedRef = useRef(false);

  // Capture the error once when the component renders
  if (!capturedRef.current) {
    capturedRef.current = true;
    console.error("Route error:", error);

    // Capture route error in PostHog
    posthog.capture("route_error_occurred", {
      error_message: error.message,
      error_name: error.name,
      error_digest: error.digest,
      error_stack: error.stack,
    });
    posthog.captureException(error);
  }

  function goHome() {
    window.location.href = "/";
  }

  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Something went wrong</CardTitle>
          <CardDescription>
            An unexpected error occurred. Please try again or contact support if
            the problem persists.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button onClick={reset}>Try again</Button>
          <Button variant="outline" onClick={goHome}>
            Go home
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
