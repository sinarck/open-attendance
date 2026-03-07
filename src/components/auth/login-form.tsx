"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { signIn } from "@/lib/auth-client";
import { toast } from "@/lib/toast";
import { getFormValues, loginFormSchema } from "@/lib/validation/auth";

export default function LoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const result = loginFormSchema.safeParse(
      getFormValues(new FormData(e.currentTarget)),
    );

    if (!result.success) {
      setLoading(false);
      toast.error("Sign in failed", result.error.issues[0]?.message);
      return;
    }

    const { email, password } = result.data;

    const { data, error } = await signIn.email({
      email,
      password,
      rememberMe,
    });

    setLoading(false);

    if (error) {
      toast.error("Sign in failed", error.message ?? "Invalid credentials");
      return;
    }

    if (data?.user?.id) {
      posthog.identify(data.user.id, {
        email,
        name: data.user.name,
      });

      posthog.capture("user_logged_in", {
        method: "email",
        user_id: data.user.id,
      });
    }

    router.push("/dashboard");
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Welcome back</CardTitle>
        <CardDescription>Enter your credentials to continue</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
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
              placeholder="Enter your password"
              autoComplete="current-password"
              required
              minLength={8}
              disabled={loading}
            />
          </Field>

          <Label className="flex cursor-pointer items-center gap-2 font-normal">
            <Checkbox
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked === true)}
              disabled={loading}
            />
            Remember me
          </Label>

          <Button type="submit" className="w-full" loading={loading}>
            Sign in
          </Button>

          <div className="flex items-center gap-4">
            <Separator className="flex-1" />
            <span className="text-xs uppercase text-muted-foreground">
              Or continue with
            </span>
            <Separator className="flex-1" />
          </div>

          <div className="grid gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => {
                posthog.capture("user_logged_in_social", {
                  provider: "google",
                });
                signIn.social({
                  provider: "google",
                  callbackURL: "/dashboard",
                });
              }}
            >
              Continue with Google
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => {
                posthog.capture("user_logged_in_social", {
                  provider: "apple",
                });
                signIn.social({ provider: "apple", callbackURL: "/dashboard" });
              }}
            >
              Continue with Apple
            </Button>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="text-foreground underline-offset-4 hover:underline"
            >
              Sign up
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
