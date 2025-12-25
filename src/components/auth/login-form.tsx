"use client";

import { ViewIcon, ViewOffIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useForm } from "@tanstack/react-form";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";
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
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { signIn } from "@/lib/auth-client";

const loginSchema = z.object({
  email: z.email("Email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  rememberMe: z.boolean(),
});

// TODO: Fix the absolute mess that is this form
export default function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [rootError, setRootError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
    validators: {
      onChange: loginSchema,
    },
    onSubmit: async ({ value }) => {
      setRootError(null);
      const { error } = await signIn.email({
        email: value.email,
        password: value.password,
        rememberMe: value.rememberMe,
      });

      if (error) {
        setRootError(error.message ?? "Invalid credentials");
        return;
      }

      router.push("/dashboard");
    },
  });

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Welcome back</CardTitle>
        <CardDescription>Enter your credentials to continue</CardDescription>
      </CardHeader>
      <CardContent>
        <Form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <form.Field name="email">
            {(field) => (
              <Field invalid={field.state.meta.errors.length > 0}>
                <FieldLabel>Email</FieldLabel>
                <Input
                  name={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  disabled={form.state.isSubmitting}
                />
                {field.state.meta.errors.length > 0 && (
                  <span className="text-xs text-destructive-foreground">
                    {field.state.meta.errors[0]?.message}
                  </span>
                )}
              </Field>
            )}
          </form.Field>

          <form.Field name="password">
            {(field) => (
              <Field invalid={field.state.meta.errors.length > 0}>
                <FieldLabel>Password</FieldLabel>
                <div className="relative">
                  <Input
                    name={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="pr-10"
                    disabled={form.state.isSubmitting}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    <HugeiconsIcon
                      icon={showPassword ? ViewOffIcon : ViewIcon}
                      size={18}
                    />
                  </button>
                </div>
                {field.state.meta.errors.length > 0 && (
                  <span className="text-xs text-destructive-foreground">
                    {field.state.meta.errors[0]?.message}
                  </span>
                )}
              </Field>
            )}
          </form.Field>

          <form.Field name="rememberMe">
            {(field) => (
              <Label className="flex cursor-pointer items-center gap-2 font-normal">
                <Checkbox
                  checked={field.state.value}
                  onCheckedChange={(checked) =>
                    field.handleChange(checked === true)
                  }
                  disabled={form.state.isSubmitting}
                />
                Remember me
              </Label>
            )}
          </form.Field>

          {rootError && (
            <p className="text-center text-sm text-destructive-foreground">
              {rootError}
            </p>
          )}

          <form.Subscribe selector={(state) => state.isSubmitting}>
            {(isSubmitting) => (
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Signing in..." : "Sign in"}
              </Button>
            )}
          </form.Subscribe>

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
              disabled={form.state.isSubmitting}
              onClick={() =>
                signIn.social({ provider: "google", callbackURL: "/dashboard" })
              }
            >
              Continue with Google
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={form.state.isSubmitting}
              onClick={() =>
                signIn.social({ provider: "apple", callbackURL: "/dashboard" })
              }
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
        </Form>
      </CardContent>
    </Card>
  );
}
