"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { UserMenu } from "@/components/user-menu";
import { authClient } from "@/lib/auth-client";

export function Navbar() {
  const session = authClient.useSession();
  const pathname = usePathname();
  if (!pathname?.endsWith("/")) {
    return null;
  }

  const user = session.data?.user;
  const isAuthPending = session.isPending && !session.data;

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 w-full max-w-screen-2xl items-center justify-between gap-6 px-4 md:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <Link href="/" className="hover:text-foreground">
              Home
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {isAuthPending ? (
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline-flex">
                <Skeleton className="h-5 w-20" />
              </span>
            </div>
          ) : user ? (
            <UserMenu />
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Log in
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
