import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getOptionalSession } from "@/lib/session";

export async function Navbar() {
  const session = await getOptionalSession();

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
      <nav className="mx-auto flex h-header max-w-5xl items-center justify-between px-page">
        <Link href="/" className="font-mono text-sm tracking-tight">
          open/attendance
        </Link>

        {session ? (
          <Button size="sm" render={<Link href={"/dashboard" as never} />}>
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
      </nav>
    </header>
  );
}
