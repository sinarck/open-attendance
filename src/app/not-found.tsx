import { ArrowRight, Home, Route } from "lucide-react";
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

export default function NotFound() {
  return (
    <Empty className="ui-app-shell justify-center px-6 py-10">
      <div className="ui-message-shell">
        <Empty className="ui-message-panel">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Route />
            </EmptyMedia>
            <EmptyTitle className="text-2xl tracking-tighter sm:text-3xl">
              Page not found
            </EmptyTitle>
            <EmptyDescription className="max-w-md text-sm/7 sm:text-base/7">
              We couldn&apos;t find the page you were looking for. It may have been moved, or the
              link may be incorrect.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent className="max-w-md">
            <div className="flex w-full flex-wrap justify-center gap-2">
              <Button render={<Link href="/" />}>
                <Home />
                Return home
              </Button>
            </div>
            <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <ArrowRight className="size-3.5" />
              <span>Check the web address, or use the main navigation.</span>
            </div>
          </EmptyContent>
        </Empty>
      </div>
    </Empty>
  );
}
