"use client";

import Loader from "@/components/loader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { useForm } from "@tanstack/react-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import z from "zod";

export default function LoginPage() {
  const router = useRouter();
  const { isPending } = authClient.useSession();

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      await authClient.signIn.email(
        {
          email: value.email,
          password: value.password,
        },
        {
          onSuccess: () => {
            router.push("/");
            toast.success("Sign in successful");
          },
          onError: (error) => {
            toast.error(error.error.message || error.error.statusText);
          },
        }
      );
    },
    validators: {
      onSubmit: z.object({
        email: z.email("Invalid email address"),
        password: z.string().min(8, "Password must be at least 8 characters"),
      }),
    },
  });

  if (isPending) {
    return <Loader />;
  }

  return (
    <div className="mx-auto w-full mt-10 max-w-md p-6 flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
          >
            <div className="flex flex-col gap-6">
              <div className="grid gap-3">
                <form.Field name="email">
                  {(field) => (
                    <div className="grid gap-3">
                      <Label htmlFor={field.name}>Email</Label>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="email"
                        placeholder="m@example.com"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        required
                      />
                      {field.state.meta.errors.map((error) => (
                        <p
                          key={error?.message}
                          className="text-red-500 text-sm"
                        >
                          {error?.message}
                        </p>
                      ))}
                    </div>
                  )}
                </form.Field>
              </div>

              <div className="grid gap-3">
                <form.Field name="password">
                  {(field) => (
                    <div className="grid gap-3">
                      <div className="flex items-center">
                        <Label htmlFor={field.name}>Password</Label>
                      </div>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="password"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        required
                      />
                      {field.state.meta.errors.map((error) => (
                        <p
                          key={error?.message}
                          className="text-red-500 text-sm"
                        >
                          {error?.message}
                        </p>
                      ))}
                    </div>
                  )}
                </form.Field>
              </div>

              <div className="flex flex-col gap-3">
                <form.Subscribe>
                  {(state) => (
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={!state.canSubmit || state.isSubmitting}
                    >
                      {state.isSubmitting ? "Submitting..." : "Login"}
                    </Button>
                  )}
                </form.Subscribe>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

