import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { username } from "better-auth/plugins";
import db from "@/db";
import * as schema from "@/db/schema/auth-schema";

export const auth = betterAuth({
  // Enable classic email + password endpoints
  emailAndPassword: {
    enabled: true,
  },
  // Add username support (adds hooks, /sign-in/username, etc.)
  plugins: [username()],
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema,
  }),
});
