import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { username } from "better-auth/plugins";
import db from "@/db";

export const auth = betterAuth({
  plugins: [username()],
  database: drizzleAdapter(db, {
    provider: "sqlite",
  }),
});
