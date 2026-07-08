"use client";

import { useEffect, useState } from "react";
import { LogOut, SunMoon, Trash2 } from "lucide-react";
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
import { signOut, useSession } from "@/lib/auth/auth-client";
import { DeleteAccountDialog } from "./delete-account-dialog";

function hardNavigateHome() {
  posthog.reset();
  // Tracking: `@convex-dev/better-auth` keeps a cached Convex token and
  // reports `isAuthenticated` while that token still exists, even after
  // Better Auth has started clearing the session. That gap can let a
  // final Convex request race after sign-out or deletion and log
  // `Not authenticated`. A full document navigation tears down the live
  // Convex subtree immediately instead of waiting for client state to settle.
  // Upstream: https://github.com/get-convex/better-auth/issues/303
  window.location.assign("/");
}

function handleSignOut() {
  posthog.capture("user_signed_out");
  void signOut({
    fetchOptions: {
      onSuccess: () => {
        hardNavigateHome();
      },
    },
  });
}

export function AuthMenu() {
  const { theme, setTheme } = useTheme();
  const { data: session, isPending } = useSession();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const userId = session?.user.id;
  const userEmail = session?.user.email;
  const userName = session?.user.name;
  const username = session?.user.username;

  useEffect(() => {
    if (!userId || !userEmail || !userName || !username) {
      return;
    }

    posthog.identify(userId, {
      email: userEmail,
      name: userName,
      username,
    });
  }, [userEmail, userId, userName, username]);

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

  return (
    <>
      <Menu>
        <MenuTrigger
          className="flex select-none cursor-pointer items-center rounded-full ring-ring/50 transition-shadow hover:ring-2 focus-visible:ring-2 focus-visible:outline-none"
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
          <MenuItem variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
            <Trash2 className="size-4" />
            Delete account
          </MenuItem>
          <MenuItem variant="destructive" onClick={handleSignOut}>
            <LogOut className="size-4" />
            Sign out
          </MenuItem>
        </MenuPopup>
      </Menu>

      {deleteDialogOpen ? (
        <DeleteAccountDialog
          open={deleteDialogOpen}
          onDeleted={hardNavigateHome}
          onOpenChange={setDeleteDialogOpen}
        />
      ) : null}
    </>
  );
}
