"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { appNavigation, isAppNavigationActive } from "@/config/navigation";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerDescription,
  DrawerHeader,
  DrawerPanel,
  DrawerPopup,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

export function AppNavbarMobile() {
  const pathname = usePathname();
  return <AppNavbarMobileDrawer pathname={pathname} />;
}

interface AppNavbarMobileDrawerProps {
  pathname: string;
}

function AppNavbarMobileDrawer({ pathname }: AppNavbarMobileDrawerProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <Drawer open={mobileOpen} onOpenChange={setMobileOpen}>
      <DrawerTrigger
        aria-label="Open menu"
        className="md:hidden"
        render={<Button size="icon-sm" variant="ghost" />}
      >
        <Menu className="size-4" />
      </DrawerTrigger>
      <DrawerPopup
        className="max-h-[min(42rem,calc(100svh-2.5rem))] border-border/60"
        showBar
        variant="inset"
      >
        <DrawerHeader className="border-b border-border/60 pb-4">
          <DrawerTitle className="font-mono text-sm font-semibold tracking-tight">
            open<span className="text-muted-foreground">/</span>attendance
          </DrawerTitle>
          <DrawerDescription className="text-xs">
            Move between attendance, meetings, members, and reports.
          </DrawerDescription>
        </DrawerHeader>
        <DrawerPanel className="pt-3">
          <nav className="flex flex-col gap-1">
            {appNavigation.map(({ href, label, icon: Icon }) => {
              const active = isAppNavigationActive(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex select-none items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors",
                    active
                      ? "bg-foreground/[0.06] text-foreground"
                      : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground",
                  )}
                >
                  <Icon className="size-4" />
                  {label}
                </Link>
              );
            })}
          </nav>
        </DrawerPanel>
      </DrawerPopup>
    </Drawer>
  );
}
