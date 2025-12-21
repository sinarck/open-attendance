"use client";

import { Route01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { BookIcon } from "lucide-react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();

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
          <Button size="sm" onClick={() => router.back()}>
            Go back
          </Button>
          <Button size="sm" variant="outline" onClick={() => router.push("/")}>
            <BookIcon />
            Return home
          </Button>
        </div>
      </EmptyContent>
    </Empty>
  );
}
