"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { appNavigation, isAppNavigationActive } from "@/config/navigation";
import { cn } from "@/lib/utils";

export function AppNavbarLinks() {
  const pathname = usePathname();

  return (
    <nav className="hidden select-none items-center gap-0.5 md:flex">
      {appNavigation.map(({ href, label }) => {
        const active = isAppNavigationActive(pathname, href);
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
