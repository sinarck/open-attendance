"use client";

import { BetterFetchError } from "better-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Form, type FormErrors } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "@/lib/auth/client";
import { toast } from "@/lib/toast";
import { loginFormSchema } from "@/lib/validation/auth";

export default function LoginForm() {
  const router = useRouter();
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formValues: Record<string, any>) {
    setErrors({});
    setLoading(true);

    const result = loginFormSchema.safeParse(formValues);

    if (!result.success) {
      setLoading(false);
      setErrors(z.flattenError(result.error).fieldErrors);
      return;
    }

    const { email, password } = result.data;

    const { error } = await signIn.email({
      email,
      password,
      rememberMe: formValues.rememberMe === true,
    });

    if (error) {
      setLoading(false);

      if (error instanceof BetterFetchError && error.status === 401) {
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

          <Label
            htmlFor="rememberMe"
            className="flex cursor-pointer items-center gap-2 font-normal"
          >
            <Checkbox id="rememberMe" name="rememberMe" disabled={loading} />
            Remember me
          </Label>

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
