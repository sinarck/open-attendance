import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { username } from "better-auth/plugins";
import { emailHarmony } from "better-auth-harmony";
import { db } from "@/db";
import * as schema from "@/db/schema/auth";
import { env } from "@/lib/env";

export const auth = betterAuth({
  baseURL: {
    fallback: env.BETTER_AUTH_URL,
    allowedHosts: ["openattendance.com", "www.openattendance.com"],
    protocol: "auto",
  },
  account: {
    encryptOAuthTokens: true,
  },
  advanced: {
    ipAddress: {
      ipAddressHeaders: ["x-forwarded-for", "x-real-ip"],
    },
    trustedProxyHeaders: Boolean(env.VERCEL_URL),
  },
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
    maxPasswordLength: 128,
    minPasswordLength: 8,
  },
  plugins: [username(), emailHarmony(), nextCookies()], // Next Cookies must be last
});
