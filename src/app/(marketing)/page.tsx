import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { Metadata } from "next";
import { TrackedLinkButton } from "@/components/ui/tracked-link-button";
import { homePreviewSession, siteConfig } from "@/config";

export const metadata: Metadata = {
  title: siteConfig.name,
  description: siteConfig.description,
};

export default function Home() {
  const totalMembers = homePreviewSession.rows.length;
  const checkedInMembers = homePreviewSession.rows.filter(
    (row) => row.status !== "absent",
  ).length;
  const attendanceRate = Math.round((checkedInMembers / totalMembers) * 100);

  return (
    <main className="bg-background">
      {/* Hero */}
      <section className="mx-auto flex min-h-[calc(100svh-var(--header-height))] max-w-5xl flex-col justify-center px-page">
        <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl">
          Attendance tracking
          <br />
          that gets out of the way.
        </h1>

        <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
          A clean system for clubs, classes, and teams. Create sessions, check
          people in, review patterns. No setup fees, no vendor lock-in.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-4">
          <TrackedLinkButton
            href="/signup"
            eventName="cta_start_tracking_clicked"
            eventProperties={{ source: "homepage", cta_text: "Start tracking" }}
          >
            Start tracking
            <HugeiconsIcon icon={ArrowRight01Icon} />
          </TrackedLinkButton>
          <TrackedLinkButton
            variant="ghost"
            href={siteConfig.repo}
            eventName="cta_github_clicked"
            eventProperties={{ source: "homepage" }}
          >
            View on GitHub
          </TrackedLinkButton>

          <span className="hidden h-4 w-px bg-border sm:block" />

          <p className="hidden gap-x-5 font-mono text-xs text-muted-foreground sm:flex">
            <span>Open source</span>
            <span>Self-hostable</span>
            <span>MIT licensed</span>
          </p>
        </div>

        {/* Product preview */}
        <div className="mt-12 overflow-hidden rounded-xl border border-border bg-card font-mono text-sm">
          <div className="flex items-center gap-2 border-b border-border px-4 py-2.5 text-xs text-muted-foreground">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            {homePreviewSession.title} - {homePreviewSession.group}
          </div>
          <div className="divide-y divide-border">
            {homePreviewSession.rows.map((row) => (
              <div
                key={row.name}
                className="flex items-center justify-between px-4 py-2.5"
              >
                <span className="text-foreground">{row.name}</span>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{row.time}</span>
                  <span
                    className={
                      row.status === "present"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : row.status === "late"
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-muted-foreground"
                    }
                  >
                    {row.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
            <span>
              {checkedInMembers} of {totalMembers} checked in
            </span>
            <span>{attendanceRate}% attendance</span>
          </div>
        </div>
      </section>
    </main>
  );
}
