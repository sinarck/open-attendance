"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { signIn, signUp } from "@/lib/auth-client";
import { toast } from "@/lib/toast";
import { getFormValues, signupFormSchema } from "@/lib/validation/auth";

export default function SignUpForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  function handleSocialSignIn(provider: "google" | "apple") {
    posthog.capture("user_signed_up_social", { provider });
    void signIn.social({ provider, callbackURL: "/dashboard" });
  }

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const result = signupFormSchema.safeParse(getFormValues(new FormData(e.currentTarget)));

    if (!result.success) {
      setLoading(false);
      toast.error("Sign up failed", result.error.issues[0]?.message);
      return;
    }

    const { name, username, email, password } = result.data;

    const { error } = await signUp.email({
      name,
      username,
      email,
      password,
      callbackURL: "/dashboard",
    });

    if (error) {
      setLoading(false);
      toast.error("Sign up failed", error.message ?? "Failed to create account");
      return;
    }

    posthog.capture("user_signed_up", { method: "email" });
    toast.success("Account created!", "Welcome to the platform");
    router.replace("/dashboard");
  }

  return (
    <Card>
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

          <div className="flex items-center gap-4">
            <Separator className="flex-1" />
            <span className="text-xs uppercase text-muted-foreground">Or continue with</span>
            <Separator className="flex-1" />
          </div>

          <div className="grid gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => handleSocialSignIn("google")}
            >
              Continue with Google
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => handleSocialSignIn("apple")}
            >
              Continue with Apple
            </Button>
          </div>

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
