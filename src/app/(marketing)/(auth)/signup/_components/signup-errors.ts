import { authClient } from "@/lib/auth/client";

export type SignUpError =
  | { code: "email"; field: "email"; title: "Email already in use"; description: string }
  | { code: "input"; title: "Check your details"; description: string }
  | { code: "slug"; field: "organizationSlug"; title: "Choose another URL"; description: string }
  | { code: "unexpected"; title: "Sign up failed"; description: string };

type AuthClientError = Error & {
  status: number;
  error?: { code?: string };
};

export function normalizeSignUpError(error: unknown): SignUpError {
  if (!(error instanceof Error) || !("status" in error) || typeof error.status !== "number") {
    return {
      code: "unexpected",
      description: "Unable to finish signup.",
      title: "Sign up failed",
    };
  }

  const authError = error as AuthClientError;

  if (authError.error?.code === authClient.$ERROR_CODES.USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL) {
    return {
      code: "email",
      field: "email",
      description: "An account with this email already exists.",
      title: "Email already in use",
    };
  }

  if (authError.status === 400) {
    return {
      code: "input",
      description: authError.message,
      title: "Check your details",
    };
  }

  if (authError.status === 422) {
    return {
      code: "slug",
      field: "organizationSlug",
      description: "Pick an available organization URL first.",
      title: "Choose another URL",
    };
  }

  return {
    code: "unexpected",
    description: authError.message,
    title: "Sign up failed",
  };
}
