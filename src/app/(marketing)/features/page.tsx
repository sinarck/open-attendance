import { HugeiconsIcon } from "@hugeicons/react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TrackedLinkButton } from "@/components/ui/tracked-link-button";
import { featuresList } from "@/config";

export default function FeaturesPage() {
  return (
    <main className="mx-auto max-w-5xl px-page py-24">
      <div className="max-w-2xl">
        <p className="font-mono text-sm text-muted-foreground">Features</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
          Attendance, simplified
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          No clocking in. No complex timesheets. Just simple, straightforward
          attendance tracking for your club, class, or team.
        </p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        {featuresList.map((feature) => (
          <Card key={feature.title}>
            <CardHeader>
              <div className="mb-2 flex size-10 items-center justify-center rounded-lg border bg-muted">
                <HugeiconsIcon
                  icon={feature.icon}
                  size={20}
                  className="text-foreground"
                />
              </div>
              <CardTitle className="text-lg">{feature.title}</CardTitle>
              <CardDescription>{feature.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="mt-16 max-w-md">
        <h2 className="text-2xl font-semibold">Ready to get started?</h2>
        <p className="mt-2 text-muted-foreground">
          It&apos;s free and takes less than a minute to set up.
        </p>
        <div className="mt-6">
          <TrackedLinkButton
            size="lg"
            href="/signup"
            eventName="features_cta_clicked"
            eventProperties={{
              source: "features_page",
              cta_text: "Get Started",
            }}
          >
            Get Started
          </TrackedLinkButton>
        </div>
      </div>
    </main>
  );
}
