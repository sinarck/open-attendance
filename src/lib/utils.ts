import { ConvexError } from "convex/values";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isAuthError(error: unknown) {
  if (error instanceof ConvexError && typeof error.data === "string") {
    return /auth/i.test(error.data);
  }

  if (error instanceof Error) {
    return /auth/i.test(error.message);
  }

  return false;
}
