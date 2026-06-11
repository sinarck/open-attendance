"use client";

import { type FormEvent, useState } from "react";
import { useConvexAuth, useQuery } from "convex/react";
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
import { deleteUser } from "@/lib/auth/auth-client";
import { isAuthClientError } from "@/lib/auth/client-errors";

interface DeleteAccountDialogProps {
  open: boolean;
  onDeleted: () => void;
  onOpenChange: (open: boolean) => void;
}

export function DeleteAccountDialog({ open, onDeleted, onOpenChange }: DeleteAccountDialogProps) {
  const { isAuthenticated } = useConvexAuth();
  const organization = useQuery(api.organizations.getCurrent, isAuthenticated ? {} : "skip");
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

  function handleDialogOpenChange(nextOpen: boolean) {
    if (deleteLoading) {
      return;
    }

    onOpenChange(nextOpen);

    if (!nextOpen) {
      resetDeleteState();
    }
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
    onDeleted();
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
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
            onClick={() => handleDialogOpenChange(false)}
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
  );
}
