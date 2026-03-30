export interface AuthClientError extends Error {
  status: number;
  error?: { code?: string };
}

export function isAuthClientError(error: unknown): error is AuthClientError {
  return error instanceof Error && "status" in error && typeof error.status === "number";
}
