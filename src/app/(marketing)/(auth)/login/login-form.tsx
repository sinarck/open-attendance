"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Form, type FormErrors } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { signIn, useSession } from "@/lib/auth/client";
import { isAuthClientError } from "@/lib/auth/client-errors";
import { toast } from "@/lib/toast";
import { loginFormSchema } from "@/lib/validation/auth";

export default function LoginForm() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!session) {
      return;
    }

    router.replace("/dashboard");
  }, [router, session]);

  if (isPending || session) {
    return null;
  }

  async function handleSubmit(formValues: Record<string, unknown>) {
    setErrors({});

    const result = loginFormSchema.safeParse(formValues);

    if (!result.success) {
      setErrors(z.flattenError(result.error).fieldErrors);
      return;
    }

    setLoading(true);

    const { email, password } = result.data;

    const { error } = await signIn.email({
      email,
      password,
      rememberMe: true,
    });

    if (error) {
      setLoading(false);

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
    router.replace("/dashboard");
  }

  return (
    <Card className="motion-safe:animate-auth-card-enter motion-reduce:animate-none">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Welcome back</CardTitle>
        <CardDescription>Enter your credentials to continue</CardDescription>
      </CardHeader>
      <CardContent>
        <Form onFormSubmit={handleSubmit} errors={errors}>
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
            <Link href="/signup" className="text-foreground underline-offset-4 hover:underline">
              Sign up
            </Link>
          </p>
        </Form>
      </CardContent>
    </Card>
  );
}
