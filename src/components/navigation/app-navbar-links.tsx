"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity } from "react";
import { appNavigation, isAppNavigationActive } from "@/config/navigation";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

export function AppNavbarLinks() {
  const pathname = usePathname();
  const isDesktop = useMediaQuery("md");

  return (
    <Activity mode={isDesktop ? "visible" : "hidden"}>
      <nav className="flex items-center gap-0.5">
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
    </Activity>
  );
}
