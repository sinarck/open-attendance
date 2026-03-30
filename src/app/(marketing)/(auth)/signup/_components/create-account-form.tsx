"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import type { ComponentPropsWithoutRef } from "react";
import { useRef, useState } from "react";
import { z } from "zod";
import { SlugStatusIndicator } from "@/components/auth/slug-status-indicator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Field,
  FieldControl,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Form, type FormErrors } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useSlugAvailability } from "@/hooks/use-slug-availability";
import { authClient } from "@/lib/auth/client";
import { getPreferredTimeZone, normalizeTimeZone } from "@/lib/date";
import { slugify } from "@/lib/slug";
import { toast } from "@/lib/toast";
import { signupFormSchema } from "@/lib/validation/auth";
import { normalizeSignUpError } from "./signup-errors";

export function CreateAccountForm() {
  const router = useRouter();
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [organizationSlug, setOrganizationSlug] = useState("");
  const autoSlugRef = useRef("");
  const slugStatus = useSlugAvailability(organizationSlug);
  const timezone = normalizeTimeZone(undefined, getPreferredTimeZone());

  const renderOrganizationSlugInput = (props: ComponentPropsWithoutRef<"input">) => (
    <input
      className="h-9 w-full min-w-0 bg-transparent pl-3 pr-12 font-mono text-sm outline-none placeholder:text-muted-foreground/72 sm:h-8"
      placeholder="robotics-society"
      autoCapitalize="none"
      autoComplete="off"
      autoCorrect="off"
      spellCheck={false}
      required
      disabled={loading}
      {...mergeProps(props, { name: "organizationSlug" })}
    />
  );

  async function handleSubmit(formValues: Record<string, unknown>) {
    setErrors({});

    if (slugStatus !== "available") {
      setErrors({ organizationSlug: "Pick an available organization URL first." });
      return;
    }

    const result = signupFormSchema.safeParse({
      ...formValues,
      timezone,
    });

    if (!result.success) {
      setErrors(z.flattenError(result.error).fieldErrors);
      return;
    }

    setLoading(true);

    try {
      await authClient.$fetch("/sign-up/email", {
        body: {
          email: result.data.email,
          name: result.data.name,
          organizationName: result.data.organizationName,
          organizationSlug: result.data.organizationSlug,
          password: result.data.password,
          timezone: result.data.timezone,
          username: result.data.username,
        },
        method: "POST",
      });
    } catch (error) {
      const signupError = normalizeSignUpError(error);
      setLoading(false);

      switch (signupError.code) {
        case "email":
        case "slug":
          setErrors({ [signupError.field]: signupError.description });
          return;
        case "input":
        case "unexpected":
          toast.error(signupError.title, signupError.description);
          return;
      }
    }

    posthog.capture("user_signed_up", { method: "email" });
    toast.success("Account created!", "Your workspace is ready.");
    router.replace("/dashboard" as Route);
  }

  return (
    <Card className="motion-safe:animate-auth-card-enter motion-reduce:animate-none">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Create an account</CardTitle>
        <CardDescription>Enter your details to get started</CardDescription>
      </CardHeader>
      <CardContent>
        <Form onFormSubmit={handleSubmit} errors={errors}>
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
            <FieldLabel>Organization URL</FieldLabel>
            <div className="group relative flex w-full rounded-lg border border-input bg-background shadow-xs transition-shadow focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/24">
              <span className="flex items-center rounded-l-lg border-r border-input bg-muted/50 px-3 text-sm text-muted-foreground">
                openattendance.app/
              </span>
              <FieldControl
                value={organizationSlug}
                onValueChange={(value) => {
                  setOrganizationSlug(slugify(value));
                }}
                render={renderOrganizationSlugInput}
              />
              <SlugStatusIndicator status={slugStatus} />
            </div>
            <FieldDescription>Lowercase letters, numbers, and hyphens.</FieldDescription>
            <FieldError />
          </Field>

          <input type="hidden" name="timezone" value={timezone} />

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
            <Link href="/login" className="text-foreground underline-offset-4 hover:underline">
              Sign in
            </Link>
          </p>
        </Form>
      </CardContent>
    </Card>
  );
}
