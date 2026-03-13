import Link from "next/link";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { isAuthenticated } from "@/lib/auth-server";

export function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
      <nav className="mx-auto flex h-header max-w-5xl items-center justify-between px-page">
        <Link href="/" className="font-mono text-sm tracking-tight">
          open/attendance
        </Link>

        <Suspense
          fallback={
            <div className="flex items-center gap-1">
              <Button size="sm" variant="ghost" render={<Link href="/login" />}>
                Log in
              </Button>
              <Button size="sm" render={<Link href="/signup" />}>
                Get Started
              </Button>
            </div>
          }
        >
          <NavbarAuth />
        </Suspense>
      </nav>
    </header>
  );
}

async function NavbarAuth() {
  const authed = await isAuthenticated();

  if (authed) {
    return (
      <Button size="sm" render={<Link href={"/dashboard"} />}>
        Open App
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Button size="sm" variant="ghost" render={<Link href="/login" />}>
        Log in
      </Button>
      <Button size="sm" render={<Link href="/signup" />}>
        Get Started
      </Button>
    </div>
  );
}
