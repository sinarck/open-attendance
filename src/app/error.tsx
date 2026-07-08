"use client";

import posthog from "posthog-js";
import { useEffect } from "react";
import { ErrorFallback } from "@/components/error-fallback";

interface ErrorPageProps {
  reset: () => void;
  error: Error & { digest?: string };
}

export default function ErrorPage({ reset, error }: ErrorPageProps) {
  useEffect(() => {
    // Error boundaries may rerender while the user retries. Report in an effect
    // so analytics stays out of render and each surfaced error is captured once.
    posthog.captureException(error);
  }, [error]);

  return <ErrorFallback reset={reset} />;
}
