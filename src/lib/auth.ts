import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { username } from "better-auth/plugins";
import { emailHarmony } from "better-auth-harmony";
import { db } from "@/db";
import * as schema from "@/db/schema/auth";
import { env } from "./env";

export const auth = betterAuth({
  baseURL:
    env.VERCEL_ENV === "production" ? env.VERCEL_URL : env.BETTER_AUTH_URL,
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
      strategy: "jwe",
    },
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [username(), emailHarmony(), nextCookies()], // Next Cookies must be last
});
