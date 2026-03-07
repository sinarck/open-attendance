"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { ErrorFallback } from "@/components/error-fallback";

interface ErrorPageProps {
  reset: () => void;
  error: Error & { digest?: string };
}

export default function ErrorPage({ reset, error }: ErrorPageProps) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return <ErrorFallback reset={reset} />;
}
