import { Home, RotateCcw, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { cn } from "@/lib/utils";

interface ErrorFallbackProps {
  className?: string;
  reset: () => void;
}

export function ErrorFallback({ className, reset }: ErrorFallbackProps) {
  return (
    <Empty className={cn("min-h-svh justify-center px-6 py-10", className)}>
      <div className="ui-message-shell">
        <Empty className="ui-message-panel">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <TriangleAlert />
            </EmptyMedia>
            <EmptyTitle className="text-2xl tracking-tighter sm:text-3xl">
              Something went wrong
            </EmptyTitle>
            <EmptyDescription className="max-w-md text-sm/7 sm:text-base/7">
              We hit a problem loading this page. Please try again, or go back home and start from
              there.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent className="max-w-md">
            <div className="flex w-full flex-wrap justify-center gap-2">
              <Button onClick={reset}>
                <RotateCcw />
                Try again
              </Button>
              <Button variant="outline" render={<Link href="/" />}>
                <Home />
                Go home
              </Button>
            </div>
          </EmptyContent>
        </Empty>
      </div>
    </Empty>
  );
}
