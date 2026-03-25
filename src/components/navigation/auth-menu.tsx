"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import { Menu, MenuItem, MenuPopup, MenuSeparator, MenuTrigger } from "@/components/ui/menu";
import { UserAvatar } from "@/components/ui/user-avatar";
import type { AppViewer } from "@/lib/app-viewer";
import { signOut } from "@/lib/auth-client";

interface AuthMenuProps {
  viewer: AppViewer;
}

export function AuthMenu({ viewer }: AuthMenuProps) {
  const router = useRouter();

  const userName = viewer.name;
  const userEmail = viewer.email;

  function handleSignOut() {
    posthog.capture("user_signed_out");
    void signOut({
      fetchOptions: {
        onSuccess: () => {
          posthog.reset();
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
        <UserAvatar name={userName} size={28} />
      </MenuTrigger>
      <MenuPopup align="end" sideOffset={8} className="w-56">
        <div className="px-3 py-2.5">
          <p className="truncate text-sm font-medium">{userName}</p>
          {userEmail ? <p className="truncate text-xs text-muted-foreground">{userEmail}</p> : null}
        </div>
        <MenuSeparator />
        <MenuItem variant="destructive" onClick={handleSignOut}>
          <LogOut className="size-4" />
          Sign out
        </MenuItem>
      </MenuPopup>
    </Menu>
  );
}
