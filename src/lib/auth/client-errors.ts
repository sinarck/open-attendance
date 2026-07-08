export interface AuthClientError extends Error {
  status: number;
  statusText?: string;
  error?: { code?: string };
}

/**
 * Narrows unknown Better Auth client failures to the error shape returned by
 * `better-fetch`.
 */
export function isAuthClientError(error: unknown): error is AuthClientError {
  return error instanceof Error && "status" in error && typeof error.status === "number";
}

/**
 * Returns whether the error represents a Better Auth rate-limit response.
 */
export function isRateLimitError(error: unknown): error is AuthClientError {
  return isAuthClientError(error) && error.status === 429;
}

/**
 * Formats the retry hint returned by Better Auth rate limits into UI copy.
 *
 * @remarks
 * The auth forms intentionally share this helper so sign-in and sign-up stay in
 * sync when Better Auth changes the retry window.
 */
export function getRateLimitDescription(retryAfter: string | null) {
  if (!retryAfter) {
    return "Please wait a moment and try again.";
  }

  const seconds = Number.parseInt(retryAfter, 10);

  if (Number.isNaN(seconds) || seconds <= 0) {
    return "Please wait a moment and try again.";
  }

  return `Please wait ${seconds} second${seconds === 1 ? "" : "s"} and try again.`;
}
