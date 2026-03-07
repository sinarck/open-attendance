"use client";

import "./globals.css";
import posthog from "posthog-js";
import { useEffect } from "react";
import { ErrorFallback } from "@/components/error-fallback";
import { cn } from "@/lib/utils";
import { figtree, geistMono } from "./ui/fonts";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    posthog.captureException(error);
  }, [error]);

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(figtree.variable, geistMono.variable)}
    >
      <body className="antialiased">
        <ErrorFallback reset={reset} />
      </body>
    </html>
  );
}
