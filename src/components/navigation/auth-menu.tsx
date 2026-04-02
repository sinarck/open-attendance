"use client";

import { LogOut, SunMoon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import posthog from "posthog-js";
import {
  Menu,
  MenuItem,
  MenuPopup,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuSub,
  MenuSubPopup,
  MenuSubTrigger,
  MenuTrigger,
} from "@/components/ui/menu";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/ui/user-avatar";
import { signOut, useSession } from "@/lib/auth/client";

export function AuthMenu() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { data: session, isPending } = useSession();

  if (isPending || !session) {
    return (
      <div
        aria-hidden
        className="flex size-7 items-center justify-center rounded-full ring-1 ring-border/60"
      >
        <Skeleton className="size-7 rounded-full" />
      </div>
    );
  }

  const { user } = session;

  function handleSignOut() {
    posthog.capture("user_signed_out");
    void signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/");
        },
      },
    });
  }

  return (
    <Menu>
      <MenuTrigger
        className="flex cursor-pointer items-center rounded-full ring-ring/50 transition-shadow hover:ring-2 focus-visible:ring-2 focus-visible:outline-none"
        aria-label="Account menu"
      >
        <UserAvatar name={user.name} size={28} />
      </MenuTrigger>
      <MenuPopup align="end" sideOffset={8} className="w-56">
        <div className="px-3 py-2.5">
          <p className="truncate text-sm font-medium">{user.name}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </div>
        <MenuSeparator />
        <MenuSub>
          <MenuSubTrigger>
            <SunMoon className="size-4" />
            Theme
          </MenuSubTrigger>
          <MenuSubPopup className="w-40">
            <MenuRadioGroup value={theme}>
              <MenuRadioItem onClick={() => setTheme("system")} value="system">
                System
              </MenuRadioItem>
              <MenuRadioItem onClick={() => setTheme("light")} value="light">
                Light
              </MenuRadioItem>
              <MenuRadioItem onClick={() => setTheme("dark")} value="dark">
                Dark
              </MenuRadioItem>
            </MenuRadioGroup>
          </MenuSubPopup>
        </MenuSub>
        <MenuSeparator />
        <MenuItem variant="destructive" onClick={handleSignOut}>
          <LogOut className="size-4" />
          Sign out
        </MenuItem>
      </MenuPopup>
    </Menu>
  );
}
