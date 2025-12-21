import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-[calc(100svh-var(--header-height))] flex-col justify-center">
      <div className="mx-auto w-full max-w-5xl px-page">
        <p className="text-muted-foreground">Attendance tracking that</p>
        <h1 className="mt-1 text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
          just works.
        </h1>

        <p className="mt-8 max-w-md text-pretty text-muted-foreground">
          No vendor lock-in. No monthly fees. No complexity.
          <br />
          Check people in. Know who showed up. That's it.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button render={<Link href="/dashboard" />}>Get started</Button>
          <Button variant="outline" render={<Link href="/docs" />}>
            Read the docs
          </Button>
        </div>
      </div>
    </main>
  );
}
