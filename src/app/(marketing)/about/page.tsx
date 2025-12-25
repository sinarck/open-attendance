import Link from "next/link";
import { Button } from "@/components/ui/button";
import { aboutValues } from "@/config";

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-5xl px-page py-24">
      <div className="max-w-2xl">
        <p className="font-mono text-sm text-muted-foreground">About</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
          Attendance tracking for everyone
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Open Attendance started from a simple observation: most attendance
          tools are either too complex, too expensive, or both. We wanted
          something that just works.
        </p>
      </div>

      <div className="mt-16 max-w-2xl">
        <h2 className="text-2xl font-semibold">What we believe</h2>
        <div className="mt-8 space-y-8">
          {aboutValues.map(({ title, description }) => (
            <div key={title}>
              <h3 className="font-medium">{title}</h3>
              <p className="mt-1 text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-16 max-w-md">
        <h2 className="text-2xl font-semibold">Get involved</h2>
        <p className="mt-2 text-muted-foreground">
          Open Attendance is free and open source. Contributions, feedback, and
          feature requests are always welcome.
        </p>
        <div className="mt-6">
          <Button size="lg" render={<Link href="/signup" />}>
            Start tracking attendance
          </Button>
        </div>
      </div>
    </main>
  );
}
