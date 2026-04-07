import Link from "next/link";
import { AuthMenu } from "@/components/navigation/auth-menu";
import { AppNavbarLinks } from "@/components/navigation/app-navbar-links";
import { AppNavbarMobile } from "@/components/navigation/app-navbar-mobile";
import { ConvexClientProvider } from "@/providers/convex-client-provider";

export function AppNavbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-lg">
      <div className="flex h-12 items-center gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="shrink-0 select-none font-mono text-sm font-semibold tracking-tight hover:opacity-80"
        >
          open<span className="text-muted-foreground">/</span>attendance
        </Link>

        <div aria-hidden className="hidden h-3.5 w-px bg-border md:block" />

        <AppNavbarLinks />

        <div className="flex-1" />

        <ConvexClientProvider>
          <AuthMenu />
        </ConvexClientProvider>
        <AppNavbarMobile />
      </div>
    </header>
  );
}
