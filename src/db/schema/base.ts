import { integer, pgTable, varchar } from "drizzle-orm/pg-core";

export const membersTable = pgTable("members", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  identifier: varchar({ length: 255 }).notNull(),
});
