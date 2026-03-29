import Link from "next/link";
import { Suspense } from "react";
import { NavbarActions } from "@/components/navigation/navbar-actions";

export function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
      <nav className="mx-auto flex h-header max-w-5xl items-center justify-between px-page">
        <Link href="/" className="font-mono text-sm tracking-tight">
          open/attendance
        </Link>
        <div className="ui-cta-slot flex items-center justify-end">
          <Suspense fallback={<div aria-hidden className="ui-cta-slot h-8" />}>
            <NavbarActions />
          </Suspense>
        </div>
      </nav>
    </header>
  );
}
