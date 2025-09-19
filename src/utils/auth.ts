import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { username } from "better-auth/plugins";
import db from "@/db";
import * as schema from "@/db/schema/auth-schema";

export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
  },
  // Keep simple: explicit allowlist. Add preview/prod domains here.
  trustedOrigins: [
    "http://localhost:3000",
    process.env.NEXT_PUBLIC_APP_URL || "",
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "",
  ].filter(Boolean) as string[],
  plugins: [username()],
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema,
  }),
});
