import { getYear } from "date-fns";
import { cacheLife } from "next/cache";
import Link from "next/link";
import { footerSections } from "@/config/navigation";
import { siteConfig } from "@/config/site";
import { StatusIndicator } from "./status-indicator";

async function getFooterYear() {
  "use cache";

  cacheLife("days");
  return getYear(new Date());
}

export async function Footer() {
  const currentYear = await getFooterYear();

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
            &copy; {currentYear} {siteConfig.name}. MIT License.
          </p>
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
    </footer>
  );
}
