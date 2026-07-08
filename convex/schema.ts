import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { rateLimitTables } from "convex-helpers/server/rateLimit";

// Reusable validators exported so mutations can reference the same types.
// "absent" is never stored; if no record exists for a member+meeting, they were absent.
export const attendanceStatus = v.union(
  v.literal("present"),
  v.literal("late"),
  v.literal("excused"),
);

export const attendanceMethod = v.union(v.literal("self"), v.literal("manual"));

// Timestamps are v.number() in Unix ms, matching the built-in _creationTime convention.

export default defineSchema({
  ...rateLimitTables,

  // One org per authenticated user, created during sign-up.
  // This is the tenant boundary; all other tables reference organizationId for isolation.
  organizations: defineTable({
    authId: v.string(), // Better Auth user._id
    name: v.string(),
    slug: v.string(), // globally unique
    timezone: v.string(), // timezone identifier used for date-fns rendering
  })
    .index("by_authId", ["authId"])
    .index("by_slug", ["slug"]),

  // People tracked for attendance (no app accounts). Imported via CSV or added manually.
  // The identifier (e.g. student ID) must be unique within the org.
  members: defineTable({
    organizationId: v.id("organizations"),
    name: v.string(),
    identifier: v.string(),
    isActive: v.boolean(), // false = archived
  })
    .index("by_org", ["organizationId"])
    .index("by_org_identifier", ["organizationId", "identifier"])
    .index("by_org_active", ["organizationId", "isActive"]),

  // A scheduled event with a check-in window.
  // Geofence and device fingerprinting are opt-in per meeting.
  meetings: defineTable({
    organizationId: v.id("organizations"),
    name: v.string(),
    description: v.optional(v.string()),
    location: v.optional(v.string()),
    startTime: v.number(),
    endTime: v.number(),
    checkInCode: v.string(),
    isActive: v.boolean(),
    tags: v.optional(v.array(v.string())),

    // Check-ins after this timestamp are "late". Defaults to endTime (nobody late).
    lateAfter: v.number(),

    geofence: v.optional(
      v.object({
        latitude: v.number(),
        longitude: v.number(),
        radiusM: v.number(),
      }),
    ),

    // When true, check-in requires a device fingerprint (one per meeting).
    requireFingerprint: v.boolean(),
  })
    .index("by_org", ["organizationId"])
    .index("by_org_active", ["organizationId", "isActive"])
    .index("by_checkInCode", ["checkInCode"]),

  // One record per member per meeting for positive statuses (present/late/excused).
  // No record = absent. _creationTime doubles as the check-in timestamp.
  attendanceRecords: defineTable({
    organizationId: v.id("organizations"), // denormalized for RLS
    meetingId: v.id("meetings"),
    memberId: v.id("members"),
    status: attendanceStatus,
    method: attendanceMethod,
    deviceFingerprint: v.optional(v.string()),
  })
    .index("by_org_meeting", ["organizationId", "meetingId"])
    .index("by_org_member", ["organizationId", "memberId"])
    .index("by_meeting_member", ["meetingId", "memberId"])
    .index("by_meeting_fingerprint", ["meetingId", "deviceFingerprint"]),
});
