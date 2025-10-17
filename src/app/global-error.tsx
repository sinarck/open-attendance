"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error: _error,
}: {
  error: Error & { digest?: string };
}) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-svh flex items-center justify-center p-6">
          <div className="mx-auto w-full max-w-lg text-center space-y-3">
            <h1 className="text-2xl font-semibold tracking-tight">
              Something went wrong
            </h1>
            <p className="text-sm text-muted-foreground">
              An unexpected error occurred.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button asChild>
                <Link href="/">Go home</Link>
              </Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
