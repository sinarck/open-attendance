"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { APP_NAV, isAppNavActive } from "@/components/navigation/app-nav";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetPanel,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export function AppNavbarMobile() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
      <SheetTrigger
        aria-label="Open menu"
        className="md:hidden"
        render={<Button size="icon-sm" variant="ghost" />}
      >
        <Menu className="size-4" />
      </SheetTrigger>
      <SheetContent side="right" className="border-border/60 sm:max-w-xs">
        <SheetHeader className="border-b border-border/60 pb-4">
          <SheetTitle className="font-mono text-sm font-semibold tracking-tight">
            open<span className="text-muted-foreground">/</span>attendance
          </SheetTitle>
          <SheetDescription className="sr-only">Navigation</SheetDescription>
        </SheetHeader>
        <SheetPanel>
          <nav className="flex flex-col gap-0.5">
            {APP_NAV.map(({ href, label, icon: Icon }) => {
              const active = isAppNavActive(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-foreground/[0.06] text-foreground"
                      : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground",
                  )}
                >
                  <Icon className="size-4" />
                  {label}
                </Link>
              );
            })}
          </nav>
        </SheetPanel>
      </SheetContent>
    </Sheet>
  );
}
