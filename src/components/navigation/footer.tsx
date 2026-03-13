import Link from "next/link";
import ThemeToggle from "@/components/ui/theme-toggle";
import { footerSections, siteConfig } from "@/config";
import { StatusIndicator } from "./status-indicator";

/** Hardcoded at build time — avoids `new Date()` which is a PPR violation. */
const CURRENT_YEAR = 2026;

export function Footer() {
  return (
    <footer className="border-t bg-card">
      <div className="mx-auto max-w-5xl px-page py-12 sm:py-16">
        <div className="flex flex-col justify-between gap-10 sm:flex-row">
          <div>
            <Link href="/" className="font-mono text-sm tracking-tight">
              open/attendance
            </Link>
            <p className="mt-3 text-sm text-muted-foreground">
              Open-source attendance tracking.
              <br />
              Built for everyone.
            </p>
            <div className="mt-4">
              <StatusIndicator />
            </div>
          </div>

          <div className="flex gap-10 sm:gap-12">
            {footerSections.map((section) => (
              <nav key={section.title} aria-label={section.title}>
                <h3 className="text-sm font-medium">{section.title}</h3>
                <ul className="mt-3 space-y-2">
                  {section.links.map(({ href, label }) => (
                    <li key={href}>
                      <Link
                        href={href}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t pt-8 text-sm text-muted-foreground sm:flex-row sm:items-center">
          <p>
            &copy; {CURRENT_YEAR} {siteConfig.name}. MIT License.
          </p>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <p>
              Designed and built by{" "}
              <Link
                href={siteConfig.author.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground underline underline-offset-4"
              >
                {siteConfig.author.name}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
