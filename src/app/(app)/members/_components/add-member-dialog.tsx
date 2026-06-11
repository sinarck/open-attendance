"use client";

import { type FormEvent, useState } from "react";
import { useMutation } from "convex/react";
import { z } from "zod";
import { api } from "../../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Form, type FormErrors } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const addMemberSchema = z.object({
  identifier: z.string().trim().min(1, "Identifier cannot be empty."),
  name: z
    .string()
    .trim()
    .min(1, "Name cannot be empty.")
    .transform((value) => value.replace(/\s+/g, " ")),
});

interface AddMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddMemberDialog({ open, onOpenChange }: AddMemberDialogProps) {
  const createMember = useMutation(api.members.create);
  const [errors, setErrors] = useState<FormErrors>({});
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formKey, setFormKey] = useState(0);

  function resetDialog() {
    setErrors({});
    setMessage(null);
    setIsSaving(false);
    setFormKey((current) => current + 1);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (isSaving && !nextOpen) {
      return;
    }

    onOpenChange(nextOpen);

    if (!nextOpen) {
      resetDialog();
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    const parsed = addMemberSchema.safeParse(Object.fromEntries(new FormData(event.currentTarget)));

    if (!parsed.success) {
      setErrors(z.flattenError(parsed.error).fieldErrors);
      return;
    }

    setErrors({});
    setIsSaving(true);

    try {
      const result = await createMember(parsed.data);

      if (!result.ok) {
        setIsSaving(false);

        if (result.code === "duplicate_identifier") {
          setErrors({ identifier: [result.message] });
          return;
        }

        setMessage(result.message);
        return;
      }

      handleOpenChange(false);
    } catch (error) {
      setIsSaving(false);
      setMessage(error instanceof Error ? error.message : "Could not add this member.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogPopup className="max-w-lg" showCloseButton={!isSaving}>
        <DialogHeader>
          <DialogTitle>Add member</DialogTitle>
        </DialogHeader>
        <DialogPanel>
          <Form key={formKey} errors={errors} id="add-member-form" onSubmit={handleSubmit}>
            {message ? (
              <div className="rounded-lg border border-destructive/20 bg-destructive/6 px-3 py-2 text-sm text-destructive-foreground">
                {message}
              </div>
            ) : null}
            <Field name="name">
              <FieldLabel>Name</FieldLabel>
              <Input
                autoComplete="off"
                disabled={isSaving}
                name="name"
                placeholder="Ada Lovelace"
              />
              <FieldError />
            </Field>
            <Field name="identifier">
              <FieldLabel>Identifier</FieldLabel>
              <Input
                autoCapitalize="off"
                autoComplete="off"
                autoCorrect="off"
                disabled={isSaving}
                name="identifier"
                placeholder="student-001"
                spellCheck={false}
              />
              <FieldDescription>
                Use a stable unique identifier like student ID or email.
              </FieldDescription>
              <FieldError />
            </Field>
          </Form>
        </DialogPanel>
        <DialogFooter>
          <Button
            disabled={isSaving}
            onClick={() => handleOpenChange(false)}
            type="button"
            variant="outline"
          >
            Cancel
          </Button>
          <Button form="add-member-form" loading={isSaving} type="submit">
            Add member
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
