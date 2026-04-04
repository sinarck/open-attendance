import { ConvexError } from "convex/values";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isAuthError(error: unknown) {
  const message =
    (error instanceof ConvexError && error.data) || (error instanceof Error && error.message) || "";

  return /auth/i.test(String(message));
}
