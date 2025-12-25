"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  function goHome() {
    window.location.href = "/";
  }

  return (
    <html lang="en">
      <body className="flex min-h-svh items-center justify-center bg-background p-6 text-foreground antialiased">
        <div className="max-w-md rounded-lg border bg-card p-6 text-card-foreground shadow-lg">
          <h1 className="mb-2 text-xl font-semibold">Something went wrong</h1>
          <p className="mb-4 text-sm text-muted-foreground">
            A critical error occurred. Please try again.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              onClick={reset}
            >
              Try again
            </button>
            <button
              type="button"
              className="rounded-md border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
              onClick={goHome}
            >
              Go home
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
