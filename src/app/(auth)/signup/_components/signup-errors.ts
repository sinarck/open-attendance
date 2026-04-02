import { authClient } from "@/lib/auth/client";
import { isAuthClientError } from "@/lib/auth/client-errors";

export type SignUpError =
  | { code: "email"; field: "email"; title: "Email already in use"; description: string }
  | { code: "input"; title: "Check your details"; description: string }
  | { code: "slug"; field: "organizationSlug"; title: "Choose another URL"; description: string }
  | { code: "unexpected"; title: "Sign up failed"; description: string };

export function normalizeSignUpError(error: unknown): SignUpError {
  if (!isAuthClientError(error)) {
    return {
      code: "unexpected",
      description: "Unable to create account.",
      title: "Sign up failed",
    };
  }

  if (error.error?.code === authClient.$ERROR_CODES.USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL) {
    return {
      code: "email",
      field: "email",
      description: "An account with this email already exists.",
      title: "Email already in use",
    };
  }

  if (error.status === 400) {
    return {
      code: "input",
      description: error.message,
      title: "Check your details",
    };
  }

  if (error.status === 422) {
    return {
      code: "slug",
      field: "organizationSlug",
      description: "Pick an available organization URL first.",
      title: "Choose another URL",
    };
  }

  return {
    code: "unexpected",
    description: error.message,
    title: "Sign up failed",
  };
}
