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
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { signIn, signUp } from "@/lib/auth-client";

const signUpSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(30, "Username must be at most 30 characters")
      .regex(
        /^[a-zA-Z0-9_.]+$/,
        "Only letters, numbers, underscores, and dots",
      ),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

function PasswordField({
  name,
  label,
  placeholder,
  value,
  onChange,
  onBlur,
  show,
  onToggle,
  disabled,
  error,
}: {
  name: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: () => void;
  show: boolean;
  onToggle: () => void;
  disabled: boolean;
  error?: string;
}) {
  return (
    <Field invalid={!!error}>
      <FieldLabel>{label}</FieldLabel>
      <div className="relative w-full">
        <Input
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          type={show ? "text" : "password"}
          placeholder={placeholder}
          autoComplete="new-password"
          className="pr-10"
          disabled={disabled}
        />
        <button
          type="button"
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
          onClick={onToggle}
          aria-label={show ? "Hide password" : "Show password"}
        >
          <HugeiconsIcon icon={show ? ViewOffIcon : ViewIcon} size={18} />
        </button>
      </div>
      {error && (
        <span className="text-xs text-destructive-foreground">{error}</span>
      )}
    </Field>
  );
}

// TODO: Fix the absolute mess that is this form
export default function SignUpForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [rootError, setRootError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      name: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    validators: {
      onChange: signUpSchema,
    },
    onSubmit: async ({ value }) => {
      setRootError(null);
      const { error } = await signUp.email({
        name: value.name,
        username: value.username,
        email: value.email,
        password: value.password,
        callbackURL: "/dashboard",
      });

      if (error) {
        setRootError(error.message ?? "Failed to create account");
        return;
      }

      router.push("/dashboard");
    },
  });

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Create an account</CardTitle>
        <CardDescription>Enter your details to get started</CardDescription>
      </CardHeader>
      <CardContent>
        <Form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <form.Field name="name">
            {(field) => (
              <Field invalid={field.state.meta.errors.length > 0}>
                <FieldLabel>Name</FieldLabel>
                <Input
                  name={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="John Doe"
                  autoComplete="name"
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

          <form.Field name="username">
            {(field) => (
              <Field invalid={field.state.meta.errors.length > 0}>
                <FieldLabel>Username</FieldLabel>
                <Input
                  name={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="johndoe"
                  autoComplete="username"
                  disabled={form.state.isSubmitting}
                />
                <FieldDescription>
                  Letters, numbers, underscores, and dots only.
                </FieldDescription>
                {field.state.meta.errors.length > 0 && (
                  <span className="text-xs text-destructive-foreground">
                    {field.state.meta.errors[0]?.message}
                  </span>
                )}
              </Field>
            )}
          </form.Field>

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
              <PasswordField
                name={field.name}
                label="Password"
                placeholder="Create a password"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                show={showPassword}
                onToggle={() => setShowPassword((v) => !v)}
                disabled={form.state.isSubmitting}
                error={field.state.meta.errors[0]?.message}
              />
            )}
          </form.Field>

          <form.Field name="confirmPassword">
            {(field) => (
              <PasswordField
                name={field.name}
                label="Confirm Password"
                placeholder="Confirm your password"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                show={showConfirm}
                onToggle={() => setShowConfirm((v) => !v)}
                disabled={form.state.isSubmitting}
                error={field.state.meta.errors[0]?.message}
              />
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
                {isSubmitting ? "Creating account..." : "Create account"}
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
            Already have an account?{" "}
            <Link
              href="/login"
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
