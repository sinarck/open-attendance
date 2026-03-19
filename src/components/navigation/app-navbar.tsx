"use client";

import {
  BarChart3,
  Calendar,
  LayoutDashboard,
  LogOut,
  Menu,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import posthog from "posthog-js";
import { useEffect, useState } from "react";
import { signOut } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/meetings", label: "Meetings", icon: Calendar },
  { href: "/members", label: "Members", icon: Users },
  { href: "/reports", label: "Reports", icon: BarChart3 },
] as const;

export function AppNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: close on route change
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  function handleSignOut() {
    posthog.capture("user_signed_out");
    signOut({
      fetchOptions: {
        onSuccess: () => {
          posthog.reset();
          router.push("/");
        },
      },
    });
  }

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-lg">
        <div className="flex h-12 items-center gap-6 px-4 sm:px-6">
          <Link
            href="/dashboard"
            className="shrink-0 font-mono text-[13px] font-semibold tracking-tight hover:opacity-80"
          >
            open/attendance
          </Link>

          <nav className="hidden items-center gap-0.5 md:flex">
            {NAV.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href as "/"}
                className={cn(
                  "relative flex items-center gap-2 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors duration-100",
                  pathname === href
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-4" />
                {label}
                {pathname === href && (
                  <span className="absolute -bottom-[13px] left-2 right-2 h-[2px] rounded-full bg-foreground" />
                )}
              </Link>
            ))}
          </nav>

          <div className="flex-1" />

          <button
            type="button"
            onClick={handleSignOut}
            className="hidden items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium text-destructive-foreground hover:bg-destructive/10 active:scale-[0.97] md:flex"
          >
            <LogOut className="size-3.5" />
            Sign Out
          </button>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex size-8 items-center justify-center rounded-md text-muted-foreground/70 hover:bg-accent hover:text-foreground active:scale-95 md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </header>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm md:hidden"
            onClick={() => setOpen(false)}
            tabIndex={-1}
            aria-label="Close menu"
          />
          <nav className="fixed top-12 right-0 left-0 z-30 border-b border-border/60 bg-background/95 backdrop-blur-lg md:hidden">
            <div className="flex flex-col gap-1 p-3">
              {NAV.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href as "/"}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-100",
                    pathname === href
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  <Icon className="size-4" />
                  {label}
                </Link>
              ))}
              <div className="my-1 h-px bg-border/60" />
              <button
                type="button"
                onClick={handleSignOut}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive-foreground hover:bg-destructive/10"
              >
                <LogOut className="size-4" />
                Sign Out
              </button>
            </div>
          </nav>
        </>
      )}
    </>
  );
}
