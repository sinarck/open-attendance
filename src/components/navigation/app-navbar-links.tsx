"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_NAV, isAppNavActive } from "@/components/navigation/app-nav";
import { cn } from "@/lib/utils";

export function AppNavbarLinks() {
  const pathname = usePathname();

  return (
    <nav className="hidden items-center gap-0.5 md:flex">
      {APP_NAV.map(({ href, label }) => {
        const active = isAppNavActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "rounded-md px-2.5 py-1 text-[13px] font-medium transition-colors duration-100",
              active
                ? "bg-foreground/[0.06] text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
