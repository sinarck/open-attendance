import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

// Application tables only
export const meetings = sqliteTable("meetings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  startAt: integer("start_at", { mode: "timestamp" }).notNull(),
  endAt: integer("end_at", { mode: "timestamp" }).notNull(),
  centerLat: real("center_lat").notNull(),
  centerLng: real("center_lng").notNull(),
  radiusM: integer("radius_m").notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  strict: integer("strict", { mode: "boolean" }).notNull().default(true),
});

export const members = sqliteTable("members", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  userId: text("user_id").notNull(),
});
