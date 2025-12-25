"use client";

import { useEffect } from "react";
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
  useEffect(() => {
    console.error("Route error:", error);
  }, [error]);

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
