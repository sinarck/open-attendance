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
    posthog.captureException(error);
  }, [error]);

  return <ErrorFallback reset={reset} />;
}
