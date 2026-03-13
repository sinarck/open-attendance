import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Reusable validators, exported so mutations can reference the same types.

// `absent` is never stored. If no record exists for a member + meeting, they were absent.
export const attendanceStatus = v.union(
  v.literal("present"), // checked in on time (at or before `startTime`)
  v.literal("late"), // checked in after `startTime` (computed server-side)
  v.literal("excused"), // manually marked by the org owner
);

export const attendanceMethod = v.union(
  v.literal("self"), // member checked in via QR / check-in link
  v.literal("manual"), // org owner recorded it
);

// Convex has no datetime type. Timestamps are `v.number()` in Unix ms,
// same convention as the built-in `_creationTime` system field.

export default defineSchema({
  // Every authenticated user gets exactly one org, created by a Better Auth
  // `user.onCreate` trigger. This is the tenant boundary; all other tables
  // reference `organizationId` for isolation.
  organizations: defineTable({
    authId: v.string(), // Better Auth `user._id`, set once by trigger
    name: v.string(), // display name, set during onboarding
    slug: v.string(), // URL-safe id, set during onboarding, globally unique
    timezone: v.string(), // IANA tz string, defaults to `"UTC"`
  })
    .index("by_authId", ["authId"])
    .index("by_slug", ["slug"]),

  // People tracked for attendance. They don't have app accounts; they're
  // imported via CSV or added manually. The `identifier` is a free-text
  // string (student ID recommended) that must be unique within the org.
  members: defineTable({
    organizationId: v.id("organizations"),
    name: v.string(),
    identifier: v.string(), // unique within org, e.g. student ID `"482910"`
    isActive: v.boolean(), // `false` = archived, excluded from new attendance
  })
    .index("by_org", ["organizationId"])
    .index("by_org_identifier", ["organizationId", "identifier"])
    .index("by_org_active", ["organizationId", "isActive"]),

  // A scheduled event with a check-in window. Geo-fence and device
  // fingerprinting are opt-in per meeting.
  meetings: defineTable({
    organizationId: v.id("organizations"),
    name: v.string(),
    description: v.optional(v.string()),
    location: v.optional(v.string()),
    startTime: v.number(), // unix ms
    endTime: v.number(), // unix ms
    checkInCode: v.string(), // 6-char alphanumeric, shown in QR code URL
    isActive: v.boolean(), // owner toggles to open/close check-ins
    tags: v.optional(v.array(v.string())),

    // geo-fence (opt-in): all three present = enabled, all absent = disabled
    geoFenceLatitude: v.optional(v.number()),
    geoFenceLongitude: v.optional(v.number()),
    geoFenceRadiusM: v.optional(v.number()),

    // when `true`, check-in requires a device fingerprint and enforces
    // one device per meeting via the `by_meeting_fingerprint` index
    requireFingerprint: v.boolean(),
  })
    .index("by_org", ["organizationId"])
    .index("by_org_active", ["organizationId", "isActive"])
    .index("by_checkInCode", ["checkInCode"]),

  // One record per member per meeting, only for positive actions (`present`,
  // `late`, `excused`). No record = absent. `_creationTime` doubles as
  // the check-in timestamp.
  attendanceRecords: defineTable({
    organizationId: v.id("organizations"), // denormalized for RLS
    meetingId: v.id("meetings"),
    memberId: v.id("members"),
    status: attendanceStatus,
    method: attendanceMethod,
    deviceFingerprint: v.optional(v.string()), // only when meeting requires it
  })
    .index("by_org_meeting", ["organizationId", "meetingId"])
    .index("by_org_member", ["organizationId", "memberId"])
    .index("by_meeting_member", ["meetingId", "memberId"])
    .index("by_meeting_fingerprint", ["meetingId", "deviceFingerprint"]),
});
