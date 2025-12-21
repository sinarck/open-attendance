import Link from "next/link";
import { footerLinks, siteConfig } from "@/config";

function StatusIndicator() {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span className="relative flex size-2">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-75" />
        <span className="relative inline-flex size-2 rounded-full bg-success" />
      </span>
      All systems online
    </div>
  );
}

export function Footer() {
  return (
    <footer className="border-t bg-card">
      <div className="mx-auto max-w-5xl px-page py-12 sm:py-16">
        <div className="flex flex-col justify-between gap-12 lg:flex-row">
          <div className="max-w-xs">
            <Link href="/" className="font-mono text-sm tracking-tight">
              open/attendance
            </Link>
            <p className="mt-3 text-sm text-muted-foreground">
              Open-source attendance tracking.
              <br />
              Built for everyone.
            </p>
            <div className="mt-6">
              <StatusIndicator />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 sm:gap-12">
            <nav aria-label="Product">
              <h3 className="text-sm font-medium">Product</h3>
              <ul className="mt-3 space-y-2">
                {footerLinks.product.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <nav aria-label="Company">
              <h3 className="text-sm font-medium">Company</h3>
              <ul className="mt-3 space-y-2">
                {footerLinks.company.map((link) => (
                  <li key={link.href}>
                    {"external" in link ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>

            <nav aria-label="Legal">
              <h3 className="text-sm font-medium">Legal</h3>
              <ul className="mt-3 space-y-2">
                {footerLinks.legal.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t pt-8 text-sm text-muted-foreground sm:flex-row sm:items-center">
          <p>
            &copy; {new Date().getFullYear()} {siteConfig.name}. MIT License.
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
