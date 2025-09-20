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
  trustedOrigins: [
    "http://localhost:3000",
    process.env.NEXT_PUBLIC_APP_URL || "",
    "https://www.attendance.voluntra.org",
  ],
  plugins: [username()],
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema,
  }),
});
