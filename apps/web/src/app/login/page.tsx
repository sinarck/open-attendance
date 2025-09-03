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
import { z } from "zod";

export default function LoginPage() {
  const router = useRouter();
  const { isPending } = authClient.useSession();

  const form = useForm({
    defaultValues: { email: "", password: "" },
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
              void form.handleSubmit();
            }}
          >
            <div className="flex flex-col gap-6">
              <div className="grid gap-3">
                <form.Field
                  name="email"
                  validators={{
                    onChange: z.string().email("Invalid email address"),
                  }}
                >
                  {(field) => (
                    <div className="grid gap-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        placeholder="m@example.com"
                        required
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                      />
                      {field.state.meta.isTouched &&
                        field.state.meta.errors.length > 0 && (
                          <p className="text-destructive text-sm">
                            {field.state.meta.errors
                              .map((e: any) =>
                                typeof e === "string"
                                  ? e
                                  : e?.message ?? JSON.stringify(e)
                              )
                              .join(", ")}
                          </p>
                        )}
                    </div>
                  )}
                </form.Field>
              </div>

              <div className="grid gap-3">
                <form.Field
                  name="password"
                  validators={{
                    onChange: z
                      .string()
                      .min(8, "Password must be at least 8 characters"),
                  }}
                >
                  {(field) => (
                    <div className="grid gap-2">
                      <Label>Password</Label>
                      <Input
                        type="password"
                        required
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                      />
                      {field.state.meta.isTouched &&
                        field.state.meta.errors.length > 0 && (
                          <p className="text-destructive text-sm">
                            {field.state.meta.errors
                              .map((e: any) =>
                                typeof e === "string"
                                  ? e
                                  : e?.message ?? JSON.stringify(e)
                              )
                              .join(", ")}
                          </p>
                        )}
                    </div>
                  )}
                </form.Field>
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={!form.state.canSubmit || form.state.isSubmitting}
                >
                  {form.state.isSubmitting ? "Submitting..." : "Login"}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

