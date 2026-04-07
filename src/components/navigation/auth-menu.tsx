"use client";

import { type FormEvent, useState } from "react";
import { useQuery } from "convex/react";
import { LogOut, SunMoon, Trash2 } from "lucide-react";
import { useTheme } from "next-themes";
import posthog from "posthog-js";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Form, type FormErrors } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { deleteUser, signOut, useSession } from "@/lib/auth/auth-client";
import { isAuthClientError } from "@/lib/auth/client-errors";

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

export function AuthMenu() {
  const { theme, setTheme } = useTheme();
  const { data: session, isPending } = useSession();
  const organization = useQuery(api.organizations.getCurrent);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleteErrors, setDeleteErrors] = useState<FormErrors>({});
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const organizationName = organization?.name ?? "";
  const canConfirmDelete =
    organizationName.length > 0 && deleteConfirmation.trim() === organizationName;

  function resetDeleteState() {
    setDeleteConfirmation("");
    setDeleteErrors({});
    setDeleteMessage(null);
    setDeleteLoading(false);
  }

  function handleDeleteDialogOpenChange(open: boolean) {
    if (deleteLoading) {
      return;
    }

    setDeleteDialogOpen(open);

    if (!open) {
      resetDeleteState();
    }
  }

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
          hardNavigateHome();
        },
      },
    });
  }

  async function handleDeleteAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDeleteErrors({});
    setDeleteMessage(null);

    if (organizationName.length === 0) {
      setDeleteMessage("Workspace details are still loading. Try again in a moment.");
      return;
    }

    if (!canConfirmDelete) {
      setDeleteErrors({
        confirmation: `Type "${organizationName}" to confirm deletion.`,
      });
      return;
    }

    setDeleteLoading(true);
    const { error } = await deleteUser();

    if (error) {
      setDeleteLoading(false);

      if (isAuthClientError(error) && (error.status === 401 || error.status === 403)) {
        setDeleteMessage("Account deletion requires a recent session. Sign in again, then retry.");
        return;
      }

      setDeleteMessage(error.message ?? "Delete account failed.");
      return;
    }

    posthog.capture("user_deleted");
    hardNavigateHome();
  }

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

      <Dialog open={deleteDialogOpen} onOpenChange={handleDeleteDialogOpenChange}>
        <DialogPopup className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete account</DialogTitle>
            <DialogDescription>
              This permanently deletes your account and workspace. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogPanel>
            <Form id="delete-account-form" errors={deleteErrors} onSubmit={handleDeleteAccount}>
              {deleteMessage ? (
                <div className="rounded-lg border border-destructive/20 bg-destructive/6 px-3 py-2 text-sm text-destructive-foreground">
                  {deleteMessage}
                </div>
              ) : null}
              <Field name="confirmation">
                <FieldLabel>Type workspace name to confirm</FieldLabel>
                <Input
                  value={deleteConfirmation}
                  onChange={(event) => setDeleteConfirmation(event.target.value)}
                  autoComplete="off"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder={organizationName || "Loading workspace..."}
                  required
                  disabled={deleteLoading || organization === undefined}
                />
                <FieldDescription>
                  Type{" "}
                  <span className="font-mono text-foreground">
                    {organization === undefined ? "Loading workspace..." : organizationName}
                  </span>{" "}
                  to continue.
                </FieldDescription>
                <FieldError />
              </Field>
            </Form>
          </DialogPanel>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleDeleteDialogOpenChange(false)}
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="delete-account-form"
              variant="destructive"
              loading={deleteLoading}
              disabled={!canConfirmDelete}
            >
              Delete account
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>
    </>
  );
}
