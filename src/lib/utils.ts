import { type ClassValue, clsx } from "clsx";
import { ConvexError } from "convex/values";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Detect auth-related Convex errors — used by jwtCache to invalidate stale tokens. */
export function isAuthError(error: unknown) {
  const message =
    (error instanceof ConvexError && error.data) ||
    (error instanceof Error && error.message) ||
    "";
  return /auth/i.test(String(message));
}
