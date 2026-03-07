import { z } from "zod";

const slashPrefixedPath = (field: string) =>
  z
    .string()
    .min(1, `${field} is required`)
    .startsWith("/", `${field} must start with '/'`)
    .refine((value) => value === "/" || !value.endsWith("/"), {
      message: `${field} must not end with '/'`,
    });

export const serverEnvSchema = {
  DATABASE_URL: z.url(),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url(),
};

export const clientEnvSchema = {
  NEXT_PUBLIC_POSTHOG_KEY: z.string().min(32),
  NEXT_PUBLIC_POSTHOG_HOST: z.url(),
  NEXT_PUBLIC_POSTHOG_API_HOST: slashPrefixedPath(
    "NEXT_PUBLIC_POSTHOG_API_HOST",
  ),
};
