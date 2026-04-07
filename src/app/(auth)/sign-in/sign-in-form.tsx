"use client";

import type { FormEvent } from "react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Form, type FormErrors } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { signIn } from "@/lib/auth/auth-client";
import {
  getRateLimitDescription,
  isAuthClientError,
  isRateLimitError,
} from "@/lib/auth/client-errors";
import { toast } from "@/lib/toast";
import { loginFormSchema } from "@/lib/validation/auth";

/**
 * Email/password login form for the public `/sign-in` route.
 */
export function SignInForm() {
  const router = useRouter();
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});

    const result = loginFormSchema.safeParse(Object.fromEntries(new FormData(event.currentTarget)));

    if (!result.success) {
      setErrors(z.flattenError(result.error).fieldErrors);
      return;
    }

    setLoading(true);

    const { email, password } = result.data;
    let rateLimitDescription = "Please wait a moment and try again.";

    // Better Auth owns credential validation and session creation. This form is
    // responsible only for local validation, UX copy, and the post-login route.
    const { error } = await signIn.email({
      email,
      password,
      rememberMe: true,
      fetchOptions: {
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

    if (error) {
      setLoading(false);

      if (isRateLimitError(error)) {
        toast.error("Too many attempts", rateLimitDescription);
        return;
      }

      if (isAuthClientError(error) && error.status === 401) {
        setErrors({
          email: "Invalid email or password.",
          password: "Invalid email or password.",
        });
        return;
      }

      toast.error("Sign in failed", error.message);
      return;
    }

    posthog.capture("user_logged_in", { method: "email" });
    router.replace("/dashboard" as Route);
  }

  return (
    <Card className="motion-safe:animate-auth-card-enter">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Welcome back</CardTitle>
        <CardDescription>Enter your credentials to continue</CardDescription>
      </CardHeader>
      <CardContent>
        <Form onSubmit={handleSubmit} errors={errors}>
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
              placeholder="Enter your password"
              autoComplete="current-password"
              required
              minLength={8}
              disabled={loading}
            />
            <FieldError />
          </Field>

          <Button type="submit" className="w-full" loading={loading}>
            Sign in
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href={"/sign-up" as Route}
              prefetch
              className="text-foreground underline-offset-4 hover:underline"
            >
              Sign up
            </Link>
          </p>
        </Form>
      </CardContent>
    </Card>
  );
}
