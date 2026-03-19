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

        <Suspense fallback={<NavbarFallback />}>
          <NavbarAuth />
        </Suspense>
      </nav>
    </header>
  );
}

function NavbarFallback() {
  return <div className="h-9 w-[172px] shrink-0 rounded-md" />;
}

async function NavbarAuth() {
  const authed = await isAuthenticated();

  return (
    <div className="flex w-[172px] shrink-0 justify-end">
      {authed ? (
        <Button size="sm" render={<Link href={"/dashboard" as "/"} />}>
          Open App
        </Button>
      ) : (
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" render={<Link href="/login" />}>
            Log in
          </Button>
          <Button size="sm" render={<Link href="/signup" />}>
            Get Started
          </Button>
        </div>
      )}
    </div>
  );
}
