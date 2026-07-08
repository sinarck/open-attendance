"use client";

import "./globals.css";
import posthog from "posthog-js";
import { useEffect } from "react";
import { ErrorFallback } from "@/components/error-fallback";
import { cn } from "@/lib/utils";
import { openRunde } from "./ui/fonts";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // This boundary replaces the entire root tree, so it owns the last-resort
    // error report for failures that happen before the normal app shell mounts.
    posthog.captureException(error);
  }, [error]);

  return (
    // Next.js requires the global error boundary to render a full document shell
    // because it runs in place of the root layout after fatal render failures.
    <html lang="en" suppressHydrationWarning className={cn(openRunde.variable)}>
      <body className="antialiased">
        <ErrorFallback reset={reset} />
      </body>
    </html>
  );
}
