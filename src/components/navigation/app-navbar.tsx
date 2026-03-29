"use client";

import { BarChart3, Calendar, LayoutDashboard, Menu, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AuthMenu } from "@/components/navigation/auth-menu";
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

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/meetings", label: "Meetings", icon: Calendar },
  { href: "/members", label: "Members", icon: Users },
  { href: "/reports", label: "Reports", icon: BarChart3 },
] as const;

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppNavbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-lg">
      <div className="flex h-12 items-center gap-6 px-4 sm:px-6">
        {/* Brand */}
        <Link
          href="/dashboard"
          className="shrink-0 font-mono text-sm font-semibold tracking-tight hover:opacity-80"
        >
          open/attendance
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden items-center gap-0.5 md:flex">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "relative flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-100",
                  active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-4" />
                {label}
                {active ? (
                  <span className="absolute -bottom-3 left-2 right-2 h-0.5 rounded-full bg-foreground" />
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="flex-1" />

        {/* Auth menu (both viewport sizes) */}
        <AuthMenu />

        {/* Mobile sheet trigger */}
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
              <SheetTitle className="text-base">Navigation</SheetTitle>
              <SheetDescription>
                Jump between dashboard, roster, meetings, and reports.
              </SheetDescription>
            </SheetHeader>
            <SheetPanel>
              <nav className="flex flex-col gap-1">
                {NAV.map(({ href, label, icon: Icon }) => {
                  const active = isActive(pathname, href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors",
                        active
                          ? "bg-accent text-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground",
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
      </div>
    </header>
  );
}
