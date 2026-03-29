"use client";

import { useMutation } from "convex/react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { SlugStatusIndicator } from "@/components/auth/slug-status-indicator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useOrganizationSlugAvailability } from "@/hooks/use-organization-slug-availability";
import { getPreferredTimeZone, normalizeTimeZone } from "@/lib/date";
import { slugifyOrganizationName } from "@/lib/organization-slug";
import { toast } from "@/lib/toast";
import type { OnboardingSearchParams } from "@/types/auth";
import { api } from "../../../../../../convex/_generated/api";

interface SignUpCompleteFormProps {
  onboarding: OnboardingSearchParams;
}

export default function SignUpCompleteForm({ onboarding }: SignUpCompleteFormProps) {
  const router = useRouter();
  const createOrganization = useMutation(api.organizations.create);
  const autoSubmitAttemptedRef = useRef(false);
  const initialOrganizationName = onboarding.name;
  const initialOrganizationSlug = onboarding.slug;
  const startingOrganizationSlug = slugifyOrganizationName(initialOrganizationSlug);
  const organizationTimeZone = normalizeTimeZone(onboarding.timezone, getPreferredTimeZone());
  const [organizationName, setOrganizationName] = useState(initialOrganizationName);
  const [organizationSlug, setOrganizationSlug] = useState(startingOrganizationSlug);
  const [hasCustomizedSlug, setHasCustomizedSlug] = useState(startingOrganizationSlug.length > 0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(initialOrganizationName.length === 0);
  const slugStatus = useOrganizationSlugAvailability(organizationSlug);

  useEffect(() => {
    if (autoSubmitAttemptedRef.current || initialOrganizationName.length === 0 || showForm) {
      return;
    }

    autoSubmitAttemptedRef.current = true;
    setIsSubmitting(true);

    void createOrganization({
      name: initialOrganizationName,
      slug: startingOrganizationSlug,
      timezone: organizationTimeZone,
    })
      .then(() => {
        toast.success("Workspace ready", "Your organization is set up.");
        router.replace("/dashboard");
      })
      .catch((error: unknown) => {
        const message =
          error instanceof Error ? error.message : "Unable to finish organization setup";

        if (message === "Organization already exists for this account") {
          router.replace("/dashboard");
          return;
        }

        if (message === "Not authenticated") {
          router.replace("/signup");
          return;
        }

        setShowForm(true);
        toast.error("Finish setup", message);
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  }, [
    createOrganization,
    initialOrganizationName,
    organizationTimeZone,
    router,
    showForm,
    startingOrganizationSlug,
  ]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (organizationName.trim().length < 2) {
      toast.error("Add your organization", "Enter your organization name to continue.");
      return;
    }

    if (organizationSlug.length < 2 || slugStatus !== "available") {
      toast.error("Choose an available URL", "Pick an available organization URL first.");
      return;
    }

    setIsSubmitting(true);

    try {
      await createOrganization({
        name: organizationName,
        slug: organizationSlug,
        timezone: organizationTimeZone,
      });
      toast.success("Workspace ready", "Your organization is set up.");
      router.replace("/dashboard");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to finish organization setup";

      if (message === "Organization already exists for this account") {
        router.replace("/dashboard");
        return;
      }

      if (message === "Not authenticated") {
        router.replace("/signup");
        return;
      }

      toast.error("Finish setup", message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!showForm) {
    return (
      <Card className="w-full max-w-sm motion-safe:animate-auth-card-enter motion-reduce:animate-none">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Finishing your workspace</CardTitle>
          <CardDescription>
            Setting up your organization URL and getting things ready.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-2">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <Card className="motion-safe:animate-auth-card-enter motion-reduce:animate-none">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Finish setting up your workspace</CardTitle>
          <CardDescription>We only need your organization name and URL.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Field>
              <FieldLabel>Organization name</FieldLabel>
              <Input
                value={organizationName}
                onChange={(event) => {
                  const nextName = event.target.value;
                  setOrganizationName(nextName);

                  if (!hasCustomizedSlug) {
                    setOrganizationSlug(slugifyOrganizationName(nextName));
                  }
                }}
                placeholder="Robotics Society"
                autoComplete="organization"
                required
                minLength={2}
                disabled={isSubmitting}
              />
            </Field>

            <Field>
              <FieldLabel>Organization URL</FieldLabel>
              <div className="group relative flex w-full rounded-lg border border-input bg-background shadow-xs transition-shadow focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/24">
                <span className="flex items-center rounded-l-lg border-r border-input bg-muted/50 px-3 text-sm text-muted-foreground">
                  openattendance.app/
                </span>
                <input
                  value={organizationSlug}
                  onChange={(event) => {
                    setHasCustomizedSlug(true);
                    setOrganizationSlug(slugifyOrganizationName(event.target.value));
                  }}
                  placeholder="robotics-society"
                  autoCapitalize="none"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  required
                  disabled={isSubmitting}
                  className="h-9 w-full min-w-0 bg-transparent pl-3 pr-12 font-mono text-sm outline-none placeholder:text-muted-foreground/72 sm:h-8"
                />
                <SlugStatusIndicator status={slugStatus} />
              </div>
              <FieldDescription>Lowercase letters, numbers, and hyphens.</FieldDescription>
            </Field>

            <Button type="submit" className="w-full" loading={isSubmitting}>
              Finish setup
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
