"use client";

import type { FormEvent } from "react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import { useRef, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Form, type FormErrors } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useSlugAvailability } from "@/hooks/use-slug-availability";
import { signUp } from "@/lib/auth/auth-client";
import { getRateLimitDescription, isRateLimitError } from "@/lib/auth/client-errors";
import { getPreferredTimeZone, normalizeTimeZone } from "@/lib/date";
import { slugify } from "@/lib/slug";
import { toast } from "@/lib/toast";
import { signupFormSchema } from "@/lib/validation/auth";
import { OrganizationSlugField } from "./organization-slug-field";
import { normalizeSignUpError } from "./signup-errors";

/**
 * Public account-creation form for `/sign-up`.
 *
 * @remarks
 * Organization provisioning is part of this same submit action. The extra
 * organization fields passed to Better Auth are consumed by the sign-up hooks in
 * `convex/auth.ts`, which normalize the data, provision the org, and roll the
 * user back if provisioning fails.
 */
export function CreateAccountForm({ appUrl }: { appUrl: string }) {
  const router = useRouter();
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [organizationSlug, setOrganizationSlug] = useState("");
  const autoSlugRef = useRef("");
  const slugStatus = useSlugAvailability(organizationSlug, !loading);
  const timezone = normalizeTimeZone(undefined, getPreferredTimeZone());

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});

    if (slugStatus !== "available") {
      setErrors({ organizationSlug: "Pick an available organization URL first." });
      return;
    }

    const result = signupFormSchema.safeParse({
      ...Object.fromEntries(new FormData(event.currentTarget)),
      organizationSlug,
      timezone,
    });

    if (!result.success) {
      setErrors(z.flattenError(result.error).fieldErrors);
      return;
    }

    setLoading(true);
    let rateLimitDescription = "Please wait a moment and try again.";
    const {
      email,
      name,
      organizationName,
      organizationSlug: submittedOrganizationSlug,
      password,
      timezone: submittedTimezone,
      username,
    } = result.data;

    try {
      // Better Auth owns account creation. The additional body fields are
      // application-specific signup metadata consumed by our Better Auth hooks.
      const { error } = await signUp.email({
        email,
        name,
        password,
        username,
        fetchOptions: {
          body: {
            organizationName,
            organizationSlug: submittedOrganizationSlug,
            rememberMe: true,
            timezone: submittedTimezone,
          },
          async onError(context) {
            const { response } = context;
            const { headers, status } = response;

            if (status !== 429) {
              return;
            }

            rateLimitDescription = getRateLimitDescription(headers.get("X-Retry-After"));
          },
        },
      });

      if (!error) {
        posthog.capture("user_signed_up", { method: "email" });
        router.replace("/dashboard" as Route);
        return;
      }

      if (isRateLimitError(error)) {
        setLoading(false);
        toast.error("Too many attempts", rateLimitDescription);
        return;
      }

      const signupError = normalizeSignUpError(error);
      const { code, description, title } = signupError;
      setLoading(false);

      switch (code) {
        case "email":
        case "slug":
          setErrors({ [signupError.field]: description });
          return;
        case "input":
        case "unexpected":
          toast.error(title, description);
          return;
      }
    } catch (error) {
      setLoading(false);
      toast.error(
        "Sign up failed",
        error instanceof Error ? error.message : "Unable to create account.",
      );
    }
  }

  return (
    <Card className="motion-safe:animate-auth-card-enter">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Create an account</CardTitle>
        <CardDescription>Enter your details to get started</CardDescription>
      </CardHeader>
      <CardContent>
        <Form onSubmit={handleSubmit} errors={errors}>
          <Field name="name">
            <FieldLabel>Name</FieldLabel>
            <Input
              placeholder="John Doe"
              autoComplete="name"
              required
              minLength={2}
              disabled={loading}
            />
            <FieldError />
          </Field>

          <Field name="username">
            <FieldLabel>Username</FieldLabel>
            <Input
              placeholder="johndoe"
              autoComplete="username"
              required
              minLength={3}
              maxLength={30}
              pattern="^[a-zA-Z0-9_.]+$"
              disabled={loading}
            />
            <FieldDescription>Letters, numbers, underscores, and dots only.</FieldDescription>
            <FieldError />
          </Field>

          <Field name="organizationName">
            <FieldLabel>Organization name</FieldLabel>
            <Input
              onChange={(event) => {
                const nextAutoSlug = slugify(event.target.value);

                if (organizationSlug === "" || organizationSlug === autoSlugRef.current) {
                  setOrganizationSlug(nextAutoSlug);
                }

                autoSlugRef.current = nextAutoSlug;
              }}
              placeholder="Robotics Society"
              autoComplete="organization"
              required
              minLength={2}
              disabled={loading}
            />
            <FieldError />
          </Field>

          <Field name="organizationSlug">
            <OrganizationSlugField
              appUrl={appUrl}
              loading={loading}
              slug={organizationSlug}
              status={slugStatus}
              onSlugChange={setOrganizationSlug}
            />
          </Field>

          <Field name="email">
            <FieldLabel>Email</FieldLabel>
            <Input
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              required
              disabled={loading}
            />
            <FieldError />
          </Field>

          <Field name="password">
            <FieldLabel>Password</FieldLabel>
            <Input
              type="password"
              placeholder="Create a password"
              autoComplete="new-password"
              required
              minLength={8}
              disabled={loading}
            />
            <FieldError />
          </Field>

          <Field name="confirmPassword">
            <FieldLabel>Confirm Password</FieldLabel>
            <Input
              type="password"
              placeholder="Confirm your password"
              autoComplete="new-password"
              required
              minLength={8}
              disabled={loading}
            />
            <FieldError />
          </Field>

          <Button type="submit" className="w-full" loading={loading}>
            Create account
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href={"/sign-in" as Route}
              prefetch
              className="text-foreground underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </Form>
      </CardContent>
    </Card>
  );
}
