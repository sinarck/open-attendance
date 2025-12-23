"use client";

import {
  Alert02Icon,
  ArrowReloadHorizontalIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { logger } from "@/lib/logger";
import { cn } from "@/lib/utils";
import { figtree, geistMono } from "./ui/fonts";
import "./globals.css";

const log = logger.child({ name: "global-error" });

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  log.error(error);

  return (
    <html lang="en" className={cn(figtree.variable, geistMono.variable)}>
      <body className="antialiased">
        <Empty className="flex justify-center items-center min-h-screen">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <HugeiconsIcon icon={Alert02Icon} />
            </EmptyMedia>
            <EmptyTitle>Something went wrong</EmptyTitle>
            <EmptyDescription>
              An unexpected error occurred. Please try again.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button size="sm" onClick={() => reset()}>
              <HugeiconsIcon icon={ArrowReloadHorizontalIcon} />
              Try again
            </Button>
          </EmptyContent>
        </Empty>
      </body>
    </html>
  );
}
