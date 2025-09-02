"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ModeToggle } from "./mode-toggle";
import UserMenu from "./user-menu";

export default function Header() {
  const pathname = usePathname();
  if (pathname?.startsWith("/checkin")) {
    return null;
  }
  const links = [{ to: "/", label: "Home" }];

  return (
    <div className="border-b bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/40">
      <div className="flex flex-row items-center justify-between px-3 py-2">
        <nav className="flex gap-2 text-sm">
          {links.map(({ to, label }) => {
            return (
              <Link
                key={to}
                href={to}
                className="px-3 py-1.5 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          <ModeToggle />
          <UserMenu />
        </div>
      </div>
    </div>
  );
}

