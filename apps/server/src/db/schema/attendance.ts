import {
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const meeting = sqliteTable("meeting", {
  id: text("id").primaryKey(), // e.g., "123"
  name: text("name"),
  startAt: integer("start_at", { mode: "timestamp" }),
  endAt: integer("end_at", { mode: "timestamp" }),
  centerLat: real("center_lat").notNull(),
  centerLng: real("center_lng").notNull(),
  radiusM: integer("radius_m").notNull(), // meters
  active: integer("active", { mode: "boolean" }).notNull().default(true),
});

export const attendeeDirectory = sqliteTable("attendee_directory", {
  userId: text("user_id").primaryKey(), // 6-digit string
  name: text("name").notNull(),
});

export const usedTokenNonce = sqliteTable("used_token_nonce", {
  nonce: text("nonce").primaryKey(),
  meetingId: text("meeting_id").notNull(),
  kioskId: text("kiosk_id").notNull(),
  consumedAt: integer("consumed_at", { mode: "timestamp" }).notNull(),
});

export const checkin = sqliteTable(
  "checkin",
  {
    id: text("id").primaryKey(),
    meetingId: text("meeting_id").notNull(),
    userId: text("user_id").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    lat: real("lat"),
    lng: real("lng"),
    accuracyM: real("accuracy_m"),
    userAgentHash: text("user_agent_hash"),
    ipHash: text("ip_hash"),
    kioskId: text("kiosk_id"),
    deviceFingerprint: text("device_fingerprint"),
  },
  (t) => ({
    uniqPerMeeting: uniqueIndex("checkin_meeting_user_unique").on(
      t.meetingId,
      t.userId
    ),
  })
);

export const usedDeviceFingerprint = sqliteTable("used_device_fingerprint", {
  fingerprint: text("fingerprint").primaryKey(),
  meetingId: text("meeting_id").notNull(),
  userId: text("user_id").notNull(),
  firstUsedAt: integer("first_used_at", { mode: "timestamp" }).notNull(),
});

