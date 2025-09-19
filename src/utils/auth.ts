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
  plugins: [username()],
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema,
  }),
});
