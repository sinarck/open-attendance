import type { Metadata } from "next";
import { homePreviewSession } from "@/config/data";
import { siteConfig } from "@/config/site";
import { HomeCtaActions } from "./_components/home-cta-actions";

export const metadata: Metadata = {
  title: siteConfig.name,
  description: siteConfig.description,
};

export default function Home() {
  const { group, rows, title } = homePreviewSession;
  const totalMembers = rows.length;
  const checkedInMembers = rows.filter(({ status }) => status !== "absent").length;
  const attendanceRate = Math.round((checkedInMembers / totalMembers) * 100);

  return (
    <main className="bg-background">
      {/* Hero */}
      <section className="ui-app-shell mx-auto flex max-w-5xl flex-col justify-center px-page">
        <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl">
          Attendance tracking
          <br />
          that gets out of the way.
        </h1>

        <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
          A clean system for clubs, classes, and teams. Create sessions, check people in, review
          patterns. No setup fees, no vendor lock-in.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-4">
          <HomeCtaActions repoUrl={siteConfig.repo} />

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
            {title} - {group}
          </div>
          <div className="divide-y divide-border">
            {rows.map(({ name, status, time }) => (
              <div key={name} className="flex items-center justify-between px-4 py-2.5">
                <span className="text-foreground">{name}</span>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{time}</span>
                  <span
                    className={
                      status === "present"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : status === "late"
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-muted-foreground"
                    }
                  >
                    {status}
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
