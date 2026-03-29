"use client";

import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import { useState } from "react";
import { SlugStatusIndicator } from "@/components/auth/slug-status-indicator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { serializeOnboardingSearchParams } from "@/config/auth";
import { useOrganizationSlugAvailability } from "@/hooks/use-organization-slug-availability";
import { signUp } from "@/lib/auth/client";
import { getPreferredTimeZone, normalizeTimeZone } from "@/lib/date";
import { slugifyOrganizationName } from "@/lib/organization-slug";
import { toast } from "@/lib/toast";
import { getFormValues, signupFormSchema } from "@/lib/validation/auth";

export default function SignUpForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [hasCustomizedSlug, setHasCustomizedSlug] = useState(false);
  const [organizationName, setOrganizationName] = useState("");
  const [organizationSlug, setOrganizationSlug] = useState("");
  const slugStatus = useOrganizationSlugAvailability(organizationSlug);
  const organizationTimeZone = getPreferredTimeZone();

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const result = signupFormSchema.safeParse(getFormValues(new FormData(e.currentTarget)));

    if (!result.success) {
      setLoading(false);
      toast.error("Sign up failed", result.error.issues[0]?.message);
      return;
    }

    if (slugStatus !== "available") {
      setLoading(false);
      toast.error("Choose an available URL", "Pick an available organization URL first.");
      return;
    }

    const { name, username, email, password, organizationName, organizationSlug, timezone } =
      result.data;
    const organizationSetupUrl = serializeOnboardingSearchParams("/signup/complete", {
      name: organizationName.trim(),
      slug: slugifyOrganizationName(organizationSlug),
      timezone: normalizeTimeZone(timezone),
    });

    const { error } = await signUp.email({
      name,
      username,
      email,
      password,
      callbackURL: organizationSetupUrl,
    });

    if (error) {
      setLoading(false);
      toast.error("Sign up failed", error.message);
      return;
    }

    posthog.capture("user_signed_up", { method: "email" });
    toast.success("Account created!", "Finishing your workspace setup...");
    router.replace(organizationSetupUrl as Route);
  }

  return (
    <Card className="motion-safe:animate-auth-card-enter motion-reduce:animate-none">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Create an account</CardTitle>
        <CardDescription>Enter your details to get started</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
          <Field>
            <FieldLabel>Name</FieldLabel>
            <Input
              name="name"
              placeholder="John Doe"
              autoComplete="name"
              required
              minLength={2}
              disabled={loading}
            />
          </Field>

          <Field>
            <FieldLabel>Organization name</FieldLabel>
            <Input
              name="organizationName"
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
              disabled={loading}
            />
          </Field>

          <Field>
            <FieldLabel>Organization URL</FieldLabel>
            <div className="group relative flex w-full rounded-lg border border-input bg-background shadow-xs transition-shadow focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/24">
              <span className="flex items-center rounded-l-lg border-r border-input bg-muted/50 px-3 text-sm text-muted-foreground">
                openattendance.app/
              </span>
              <input
                name="organizationSlug"
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
                disabled={loading}
                className="h-9 w-full min-w-0 bg-transparent pl-3 pr-12 font-mono text-sm outline-none placeholder:text-muted-foreground/72 sm:h-8"
              />
              <SlugStatusIndicator status={slugStatus} />
            </div>
            <FieldDescription>Lowercase letters, numbers, and hyphens.</FieldDescription>
          </Field>

          <Field>
            <FieldLabel>Username</FieldLabel>
            <Input
              name="username"
              placeholder="johndoe"
              autoComplete="username"
              required
              minLength={3}
              maxLength={30}
              pattern="^[a-zA-Z0-9_.]+$"
              disabled={loading}
            />
            <FieldDescription>Letters, numbers, underscores, and dots only.</FieldDescription>
          </Field>

          <input type="hidden" name="timezone" value={organizationTimeZone} />

          <Field>
            <FieldLabel>Email</FieldLabel>
            <Input
              name="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              required
              disabled={loading}
            />
          </Field>

          <Field>
            <FieldLabel>Password</FieldLabel>
            <Input
              name="password"
              type="password"
              placeholder="Create a password"
              autoComplete="new-password"
              required
              minLength={8}
              disabled={loading}
            />
          </Field>

          <Field>
            <FieldLabel>Confirm Password</FieldLabel>
            <Input
              name="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              autoComplete="new-password"
              required
              minLength={8}
              disabled={loading}
            />
          </Field>

          <Button type="submit" className="w-full" loading={loading}>
            Create account
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-foreground underline-offset-4 hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
