import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { homeHighlights } from "@/config";

export default function Home() {
  return (
    <main className="flex min-h-[calc(100svh-var(--header-height))] flex-col justify-center">
      <div className="mx-auto w-full max-w-5xl px-page">
        <p className="font-mono text-sm text-muted-foreground">
          Attendance tracking that
        </p>
        <h1 className="mt-2 text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
          just works.
        </h1>

        <p className="mt-6 max-w-lg text-lg text-muted-foreground">
          Simple presence tracking for clubs, classes, and teams. Check people
          in. Know who showed up. That&apos;s it.
        </p>

        <ul className="mt-8 flex flex-col gap-2 sm:flex-row sm:gap-6">
          {homeHighlights.map((item) => (
            <li key={item} className="flex items-center gap-2 text-sm">
              <HugeiconsIcon
                icon={CheckmarkCircle02Icon}
                size={16}
                className="text-success-foreground"
              />
              {item}
            </li>
          ))}
        </ul>

        <div className="mt-10 flex flex-wrap gap-3">
          <Button size="lg" render={<Link href="/signup" />}>
            Get started for free
          </Button>
          <Button
            size="lg"
            variant="outline"
            render={<Link href="/features" />}
          >
            See how it works
          </Button>
        </div>
      </div>
    </main>
  );
}
