import { sql } from "drizzle-orm";
import {
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { user } from "@/db/schema/auth-schema";

// Application tables only
export const meetings = sqliteTable(
  "meetings",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    description: text("description"),
    slug: text("slug").unique(),
    startAt: integer("start_at", { mode: "timestamp" }).notNull(),
    endAt: integer("end_at", { mode: "timestamp" }).notNull(),
    centerLat: real("center_lat").notNull(),
    centerLng: real("center_lng").notNull(),
    radiusM: integer("radius_m").notNull(),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    strict: integer("strict", { mode: "boolean" }).notNull().default(true),
    createdAt: integer("created_at", { mode: "timestamp" })
      .default(sql`(unixepoch() * 1000)`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .default(sql`(unixepoch() * 1000)`)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => ({
    startIdx: index("meetings_start_idx").on(table.startAt),
    endIdx: index("meetings_end_idx").on(table.endAt),
    activeIdx: index("meetings_active_idx").on(table.active),
    // Ensure startAt < endAt at application level; SQLite check is optional
  }),
);

export const members = sqliteTable(
  "members",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    // Six-digit club identifier visible to admins; enforce format via CHECK
    clubId: text("club_id").notNull(),
    authUserId: text("auth_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .default(sql`(unixepoch() * 1000)`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .default(sql`(unixepoch() * 1000)`)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => ({
    clubIdUq: uniqueIndex("members_club_id_uq").on(table.clubId),
    authUserIdx: index("members_auth_user_idx").on(table.authUserId),
  }),
);

export const attendance = sqliteTable(
  "attendance",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    meetingId: integer("meeting_id")
      .notNull()
      .references(() => meetings.id, { onDelete: "cascade" }),
    memberId: integer("member_id")
      .notNull()
      .references(() => members.id, { onDelete: "cascade" }),
    checkInAt: integer("check_in_at", { mode: "timestamp" }).notNull(),
    checkInLat: real("check_in_lat"),
    checkInLng: real("check_in_lng"),
    distanceM: real("distance_m"),
    method: text("method")
      .$type<"geo" | "manual" | "override">()
      .notNull()
      .default("geo"),
    status: text("status")
      .$type<"present" | "late" | "excused">()
      .notNull()
      .default("present"),
    notes: text("notes"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .default(sql`(unixepoch() * 1000)`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .default(sql`(unixepoch() * 1000)`)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => ({
    uniqAttendance: uniqueIndex("attendance_member_meeting_uq").on(
      table.memberId,
      table.meetingId,
    ),
    memberIdx: index("attendance_member_idx").on(table.memberId),
    meetingIdx: index("attendance_meeting_idx").on(table.meetingId),
    checkInIdx: index("attendance_check_in_idx").on(table.checkInAt),
  }),
);
