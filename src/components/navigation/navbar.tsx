"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ui/theme-toggle";

export function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
      <nav className="mx-auto flex h-header max-w-5xl items-center justify-between px-page">
        <Link href="/" className="font-mono text-sm tracking-tight">
          open/attendance
        </Link>

        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Button size="sm" variant="ghost" render={<Link href="/login" />}>
            Log in
          </Button>
        </div>
      </nav>
    </header>
  );
}
