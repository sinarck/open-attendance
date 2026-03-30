import { ConvexError, v } from "convex/values";
import { isAfter, isBefore } from "date-fns";
import haversine from "haversine-distance";
import type { Doc } from "./_generated/dataModel";
import { mutation } from "./_generated/server";
import { authedMutation, authedQuery } from "./lib/auth";
import { rateLimit } from "./lib/rateLimits";
import {
  normalizeCheckInCode,
  normalizeDeviceFingerprint,
  normalizeMemberIdentifier,
} from "./lib/validation";
import { attendanceStatus } from "./schema";
const attendanceCheckInErrorMessages = {
  invalid_check_in_code: "Invalid check-in code",
  check_in_closed: "Check-ins are closed for this meeting",
  check_in_not_started: "Check-in has not started yet",
  check_in_ended: "Check-in has ended",
  location_required: "This meeting requires location verification",
  outside_allowed_area: "You are outside the allowed check-in area",
  invalid_member_identifier: "Member not found. Check your identifier.",
  member_inactive: "This member is no longer active",
  already_checked_in: "Already checked in for this meeting",
  device_verification_required: "This meeting requires device verification",
  device_already_used: "This device has already been used to check in",
} as const;
const attendanceMutationErrorMessages = {
  meeting_not_found: "Meeting not found in your organization",
  member_not_found: "Member not found in your organization",
  attendance_record_not_found: "Attendance record not found",
} as const;

type AttendanceCheckInErrorCode = keyof typeof attendanceCheckInErrorMessages;
type AttendanceMutationErrorCode = keyof typeof attendanceMutationErrorMessages;
type CheckInResult =
  | { ok: true; id: Doc<"attendanceRecords">["_id"] }
  | { ok: false; code: AttendanceCheckInErrorCode; message: string };
type AttendanceMutationResult =
  | { ok: true; id: Doc<"attendanceRecords">["_id"] }
  | { ok: false; code: AttendanceMutationErrorCode; message: string };

function attendanceCheckInError(code: AttendanceCheckInErrorCode) {
  return { ok: false, code, message: attendanceCheckInErrorMessages[code] } as const;
}

function attendanceMutationError(code: AttendanceMutationErrorCode) {
  return { ok: false, code, message: attendanceMutationErrorMessages[code] } as const;
}

/** Public check-in (unauthenticated, called by members scanning QR codes). */
export const checkIn = mutation({
  args: {
    code: v.string(),
    identifier: v.string(),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    deviceFingerprint: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<CheckInResult> => {
    const code = normalizeCheckInCode(args.code);
    const identifier = normalizeMemberIdentifier(args.identifier);
    const deviceFingerprint =
      args.deviceFingerprint === undefined
        ? undefined
        : normalizeDeviceFingerprint(args.deviceFingerprint);

    const meeting = await ctx.db
      .query("meetings")
      .withIndex("by_checkInCode", (q) => q.eq("checkInCode", code))
      .unique();

    if (!meeting) return attendanceCheckInError("invalid_check_in_code");

    await rateLimit(ctx, {
      name: "checkIn",
      key: `${meeting._id}`,
      throws: true,
    });

    if (!meeting.isActive) return attendanceCheckInError("check_in_closed");

    const now = Date.now();
    if (isBefore(now, meeting.startTime)) return attendanceCheckInError("check_in_not_started");
    if (isAfter(now, meeting.endTime)) return attendanceCheckInError("check_in_ended");

    if (meeting.geofence) {
      if (args.latitude === undefined || args.longitude === undefined) {
        return attendanceCheckInError("location_required");
      }

      const distance = haversine(
        {
          latitude: meeting.geofence.latitude,
          longitude: meeting.geofence.longitude,
        },
        { latitude: args.latitude, longitude: args.longitude },
      );

      if (distance > meeting.geofence.radiusM) {
        return attendanceCheckInError("outside_allowed_area");
      }
    }

    const member = await ctx.db
      .query("members")
      .withIndex("by_org_identifier", (q) =>
        q.eq("organizationId", meeting.organizationId).eq("identifier", identifier),
      )
      .unique();

    if (!member) return attendanceCheckInError("invalid_member_identifier");
    if (!member.isActive) return attendanceCheckInError("member_inactive");

    const existingRecord = await ctx.db
      .query("attendanceRecords")
      .withIndex("by_meeting_member", (q) =>
        q.eq("meetingId", meeting._id).eq("memberId", member._id),
      )
      .unique();

    if (existingRecord) return attendanceCheckInError("already_checked_in");

    // When lateAfter === endTime (the default), nobody can be late.
    const status: Doc<"attendanceRecords">["status"] = isAfter(now, meeting.lateAfter)
      ? "late"
      : "present";

    if (!meeting.requireFingerprint) {
      return {
        ok: true,
        id: await ctx.db.insert("attendanceRecords", {
          organizationId: meeting.organizationId,
          meetingId: meeting._id,
          memberId: member._id,
          status,
          method: "self",
        }),
      };
    }

    if (!deviceFingerprint) {
      return attendanceCheckInError("device_verification_required");
    }

    const existingFingerprint = await ctx.db
      .query("attendanceRecords")
      .withIndex("by_meeting_fingerprint", (q) =>
        q.eq("meetingId", meeting._id).eq("deviceFingerprint", deviceFingerprint),
      )
      .unique();

    if (existingFingerprint) {
      return attendanceCheckInError("device_already_used");
    }

    return {
      ok: true,
      id: await ctx.db.insert("attendanceRecords", {
        organizationId: meeting.organizationId,
        meetingId: meeting._id,
        memberId: member._id,
        status,
        method: "self",
        deviceFingerprint,
      }),
    };
  },
});

export const listByMeeting = authedQuery({
  args: { meetingId: v.id("meetings") },
  handler: async (ctx, { meetingId }) => {
    const meeting = await ctx.db.get("meetings", meetingId);
    if (!meeting) throw new ConvexError("Meeting not found in your organization");

    return ctx.db
      .query("attendanceRecords")
      .withIndex("by_org_meeting", (q) =>
        q.eq("organizationId", ctx.organizationId).eq("meetingId", meetingId),
      )
      .collect();
  },
});

export const listByMember = authedQuery({
  args: { memberId: v.id("members") },
  handler: async (ctx, { memberId }) => {
    const member = await ctx.db.get("members", memberId);
    if (!member) throw new ConvexError("Member not found in your organization");

    return ctx.db
      .query("attendanceRecords")
      .withIndex("by_org_member", (q) =>
        q.eq("organizationId", ctx.organizationId).eq("memberId", memberId),
      )
      .collect();
  },
});

/** Manually record or update attendance (admin upsert). */
export const markManual = authedMutation({
  args: {
    meetingId: v.id("meetings"),
    memberId: v.id("members"),
    status: attendanceStatus,
  },
  handler: async (ctx, { meetingId, memberId, status }): Promise<AttendanceMutationResult> => {
    await rateLimit(ctx, {
      name: "orgWrite",
      key: ctx.organizationId,
      throws: true,
    });

    // RLS-wrapped db.get returns null for docs outside the caller's org,
    // so "not found" covers both non-existent and wrong-org cases.
    const meeting = await ctx.db.get("meetings", meetingId);
    if (!meeting) return attendanceMutationError("meeting_not_found");

    const member = await ctx.db.get("members", memberId);
    if (!member) return attendanceMutationError("member_not_found");

    const existing = await ctx.db
      .query("attendanceRecords")
      .withIndex("by_meeting_member", (q) => q.eq("meetingId", meetingId).eq("memberId", memberId))
      .unique();

    if (!existing) {
      return {
        ok: true,
        id: await ctx.db.insert("attendanceRecords", {
          organizationId: ctx.organizationId,
          meetingId,
          memberId,
          status,
          method: "manual",
        }),
      };
    }

    if (existing.status === status && existing.method === "manual") {
      return { ok: true, id: existing._id };
    }

    await ctx.db.patch("attendanceRecords", existing._id, {
      status,
      method: "manual",
    });
    return { ok: true, id: existing._id };
  },
});

export const removeRecord = authedMutation({
  args: { recordId: v.id("attendanceRecords") },
  handler: async (ctx, { recordId }): Promise<AttendanceMutationResult> => {
    await rateLimit(ctx, {
      name: "orgWrite",
      key: ctx.organizationId,
      throws: true,
    });

    const record = await ctx.db.get("attendanceRecords", recordId);

    if (!record) return attendanceMutationError("attendance_record_not_found");
    await ctx.db.delete("attendanceRecords", recordId);
    return { ok: true, id: recordId };
  },
});

/** Summary stats for a meeting: present, late, excused, absent, total roster. */
export const meetingSummary = authedQuery({
  args: { meetingId: v.id("meetings") },
  handler: async (ctx, { meetingId }) => {
    const meeting = await ctx.db.get("meetings", meetingId);
    if (!meeting) throw new ConvexError("Meeting not found in your organization");

    const records = await ctx.db
      .query("attendanceRecords")
      .withIndex("by_org_meeting", (q) =>
        q.eq("organizationId", ctx.organizationId).eq("meetingId", meetingId),
      )
      .collect();

    const totalMembers = await ctx.db
      .query("members")
      .withIndex("by_org_active", (q) =>
        q.eq("organizationId", ctx.organizationId).eq("isActive", true),
      )
      .collect();

    const counts = { present: 0, late: 0, excused: 0 };
    for (const r of records) {
      if (r.status in counts) {
        counts[r.status as keyof typeof counts]++;
      }
    }

    return {
      ...counts,
      absent: totalMembers.length - records.length,
      total: totalMembers.length,
    };
  },
});

/** Attendance rate for a single member across all meetings. */
export const memberStats = authedQuery({
  args: { memberId: v.id("members") },
  handler: async (ctx, { memberId }) => {
    const member = await ctx.db.get("members", memberId);
    if (!member) throw new ConvexError("Member not found in your organization");

    const records = await ctx.db
      .query("attendanceRecords")
      .withIndex("by_org_member", (q) =>
        q.eq("organizationId", ctx.organizationId).eq("memberId", memberId),
      )
      .collect();

    const totalMeetings = await ctx.db
      .query("meetings")
      .withIndex("by_org", (q) => q.eq("organizationId", ctx.organizationId))
      .collect();

    const present = records.filter((r) => r.status === "present" || r.status === "late").length;
    const excused = records.filter((r) => r.status === "excused").length;

    return {
      present,
      excused,
      absent: totalMeetings.length - records.length,
      totalMeetings: totalMeetings.length,
      rate: totalMeetings.length > 0 ? Math.round((present / totalMeetings.length) * 100) : 0,
    };
  },
});
