import {
  ArrowRight01Icon,
  Home09Icon,
  Route01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
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
    <Empty className="min-h-[calc(100svh-var(--header-height))] justify-center px-6 py-10">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-2">
        <Empty className="min-h-[24rem] rounded-[calc(var(--radius-2xl)-2px)] border border-dashed border-border/70 bg-background p-8 md:p-10">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <HugeiconsIcon icon={Route01Icon} />
            </EmptyMedia>
            <EmptyTitle className="text-2xl tracking-[-0.04em] sm:text-3xl">
              Page not found
            </EmptyTitle>
            <EmptyDescription className="max-w-md text-sm/7 sm:text-base/7">
              We couldn&apos;t find the page you were looking for. It may have
              been moved, or the link may be incorrect.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent className="max-w-md">
            <div className="flex w-full flex-wrap justify-center gap-2">
              <Button render={<Link href="/" />}>
                <HugeiconsIcon icon={Home09Icon} />
                Return home
              </Button>
            </div>
            <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <HugeiconsIcon icon={ArrowRight01Icon} className="size-3.5" />
              <span>Check the web address, or use the main navigation.</span>
            </div>
          </EmptyContent>
        </Empty>
      </div>
    </Empty>
  );
}
