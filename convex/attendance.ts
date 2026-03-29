import { ConvexError, v } from "convex/values";
import { NoOp } from "convex-helpers/server/customFunctions";
import { zCustomMutation } from "convex-helpers/server/zod4";
import { isAfter, isBefore } from "date-fns";
import haversine from "haversine-distance";
import { z } from "zod";
import type { Doc } from "./_generated/dataModel";
import { mutation } from "./_generated/server";
import { authedMutation, authedQuery } from "./lib/auth";
import { rateLimit } from "./lib/rateLimits";
import {
  checkInCodeSchema,
  deviceFingerprintSchema,
  memberIdentifierSchema,
} from "./lib/validation";
import { attendanceStatus } from "./schema";

const zMutation = zCustomMutation(mutation, NoOp);

/** Public check-in (unauthenticated, called by members scanning QR codes). */
export const checkIn = zMutation({
  args: {
    code: checkInCodeSchema,
    identifier: memberIdentifierSchema,
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    deviceFingerprint: deviceFingerprintSchema.optional(),
  },
  handler: async (ctx, { code, identifier, latitude, longitude, deviceFingerprint }) => {
    const meeting = await ctx.db
      .query("meetings")
      .withIndex("by_checkInCode", (q) => q.eq("checkInCode", code))
      .unique();

    if (!meeting) throw new ConvexError("Invalid check-in code");

    await rateLimit(ctx, {
      name: "checkIn",
      key: `${meeting._id}`,
      throws: true,
    });

    if (!meeting.isActive) throw new ConvexError("Check-ins are closed for this meeting");

    const now = Date.now();
    if (isBefore(now, meeting.startTime)) throw new ConvexError("Check-in has not started yet");
    if (isAfter(now, meeting.endTime)) throw new ConvexError("Check-in has ended");

    if (meeting.geofence) {
      if (latitude === undefined || longitude === undefined) {
        throw new ConvexError("This meeting requires location verification");
      }

      const distance = haversine(
        {
          latitude: meeting.geofence.latitude,
          longitude: meeting.geofence.longitude,
        },
        { latitude, longitude },
      );

      if (distance > meeting.geofence.radiusM) {
        throw new ConvexError("You are outside the allowed check-in area");
      }
    }

    const member = await ctx.db
      .query("members")
      .withIndex("by_org_identifier", (q) =>
        q.eq("organizationId", meeting.organizationId).eq("identifier", identifier),
      )
      .unique();

    if (!member) throw new ConvexError("Member not found. Check your identifier.");
    if (!member.isActive) throw new ConvexError("This member is no longer active");

    const existingRecord = await ctx.db
      .query("attendanceRecords")
      .withIndex("by_meeting_member", (q) =>
        q.eq("meetingId", meeting._id).eq("memberId", member._id),
      )
      .unique();

    if (existingRecord) throw new ConvexError("Already checked in for this meeting");

    // When lateAfter === endTime (the default), nobody can be late.
    const status: Doc<"attendanceRecords">["status"] = isAfter(now, meeting.lateAfter)
      ? "late"
      : "present";

    if (!meeting.requireFingerprint) {
      return ctx.db.insert("attendanceRecords", {
        organizationId: meeting.organizationId,
        meetingId: meeting._id,
        memberId: member._id,
        status,
        method: "self",
      });
    }

    if (!deviceFingerprint) {
      throw new ConvexError("This meeting requires device verification");
    }

    const existingFingerprint = await ctx.db
      .query("attendanceRecords")
      .withIndex("by_meeting_fingerprint", (q) =>
        q.eq("meetingId", meeting._id).eq("deviceFingerprint", deviceFingerprint),
      )
      .unique();

    if (existingFingerprint) {
      throw new ConvexError("This device has already been used to check in");
    }

    return ctx.db.insert("attendanceRecords", {
      organizationId: meeting.organizationId,
      meetingId: meeting._id,
      memberId: member._id,
      status,
      method: "self",
      deviceFingerprint,
    });
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
  handler: async (ctx, { meetingId, memberId, status }) => {
    await rateLimit(ctx, {
      name: "orgWrite",
      key: ctx.organizationId,
      throws: true,
    });

    // RLS-wrapped db.get returns null for docs outside the caller's org,
    // so "not found" covers both non-existent and wrong-org cases.
    const meeting = await ctx.db.get("meetings", meetingId);
    if (!meeting) throw new ConvexError("Meeting not found in your organization");

    const member = await ctx.db.get("members", memberId);
    if (!member) throw new ConvexError("Member not found in your organization");

    const existing = await ctx.db
      .query("attendanceRecords")
      .withIndex("by_meeting_member", (q) => q.eq("meetingId", meetingId).eq("memberId", memberId))
      .unique();

    if (!existing) {
      return ctx.db.insert("attendanceRecords", {
        organizationId: ctx.organizationId,
        meetingId,
        memberId,
        status,
        method: "manual",
      });
    }

    if (existing.status === status && existing.method === "manual") {
      return existing._id;
    }

    await ctx.db.patch("attendanceRecords", existing._id, {
      status,
      method: "manual",
    });
    return existing._id;
  },
});

export const removeRecord = authedMutation({
  args: { recordId: v.id("attendanceRecords") },
  handler: async (ctx, { recordId }) => {
    await rateLimit(ctx, {
      name: "orgWrite",
      key: ctx.organizationId,
      throws: true,
    });

    const record = await ctx.db.get("attendanceRecords", recordId);

    if (!record) throw new ConvexError("Attendance record not found");
    await ctx.db.delete("attendanceRecords", recordId);
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
