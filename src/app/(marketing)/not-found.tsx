import { Book02Icon, Route01Icon } from "@hugeicons/core-free-icons";
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
    <Empty className="flex justify-center items-center min-h-screen">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <HugeiconsIcon icon={Route01Icon} />
        </EmptyMedia>
        <EmptyTitle>Page not found</EmptyTitle>
        <EmptyDescription>
          Sorry, we couldn't find what you were looking for.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" render={<Link href="/" />}>
            <HugeiconsIcon icon={Book02Icon} />
            Return home
          </Button>
        </div>
      </EmptyContent>
    </Empty>
  );
}
