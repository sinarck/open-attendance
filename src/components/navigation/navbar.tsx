"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ui/theme-toggle";
import { navLinks } from "@/config";

export function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
      <nav className="mx-auto flex h-header max-w-5xl items-center justify-between px-page">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-mono text-sm tracking-tight">
            open/attendance
          </Link>

          <ul className="hidden items-center gap-1 sm:flex">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Button
                  size="sm"
                  variant="ghost"
                  render={<Link href={link.href} />}
                >
                  {link.label}
                </Button>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Button size="sm" variant="ghost" render={<Link href={"/login"} />}>
            Log in
          </Button>
          <Button size="sm" render={<Link href={"/signup"} />}>
            Sign up
          </Button>
        </div>
      </nav>
    </header>
  );
}
